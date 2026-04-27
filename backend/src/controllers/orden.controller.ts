// backend/src/controllers/orden.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { confirmarPagoYDescontarStock } from '../services/orden.service.js';



const prisma = new PrismaClient();

export const agregarAlCarrito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productoId, cantidad } = req.body;
    const clienteId = req.body.clienteId; // Obtenido del token o sesión
    
    // Validar stock disponible antes de agregar
    const stock = await prisma.invStockProducto.findUnique({ where: { productoId } });
    if (!stock || (stock.stockFisico - stock.stockReservado) < cantidad) {
      throw new AppError('Stock insuficiente', 400);
    }

    let carrito = await prisma.ordCarrito.findFirst({ where: { clienteId } });
    if (!carrito) carrito = await prisma.ordCarrito.create({ data: { clienteId } });

    const itemExistente = await prisma.ordItemCarrito.findFirst({
      where: { carritoId: carrito.id, productoId }
    });

    if (itemExistente) {
      await prisma.ordItemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: { increment: cantidad } }
      });
    } else {
      await prisma.ordItemCarrito.create({
        data: { carritoId: carrito.id, productoId, cantidad }
      });
    }

    res.json({ success: true, message: 'Producto agregado al carrito' });
  } catch (error) { next(error); }
};

// backend/src/controllers/orden.controller.ts

export const checkoutCompleto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) throw new AppError('No autenticado', 401);

    let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
    if (!cliente) {
      cliente = await prisma.cliCliente.create({ data: { usuarioId, razonSocial: 'Cliente Final' } });
    }

    const { direccionEnvio, metodoEnvioId, items } = req.body;

    await prisma.$transaction(async (tx) => {
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('El carrito está vacío.', 400);
      }

      let subtotalProductos = 0;
      const itemsData = [];

      for (const item of items) {
        // SANITIZACIÓN EXTREMA: Forzar a que sean números válidos, si no, tirar error controlado 400
        const prodId = Number(item.productoId);
        const cant = Number(item.cantidad);
        
        if (isNaN(prodId) || isNaN(cant) || cant <= 0) {
          throw new AppError(`Datos de cantidad inválidos para un producto.`, 400);
        }

        // 1. Buscar producto real en BD (para obtener precio real y no confiar en el Frontend)
        const producto = await tx.catProducto.findUnique({ 
          where: { id: prodId },
          select: { nombre: true, sku: true, precioVenta: true }
        });

        if (!producto) {
          throw new AppError(`El producto con ID ${prodId} ya no existe o fue eliminado.`, 400);
        }

        // 1.5. Validar stock disponible antes de reservar
        const stockInfo = await tx.invStockProducto.findUnique({ 
          where: { productoId: prodId },
          select: { stockFisico: true, stockReservado: true }
        });

        if (!stockInfo) {
          throw new AppError(`No se encontró información de stock para el producto ${prodId}.`, 400);
        }

        const stockDisponible = stockInfo.stockFisico - stockInfo.stockReservado;
        if (stockDisponible < cant) {
          throw new AppError(`Stock insuficiente para ${producto.nombre}. Disponible: ${stockDisponible}, solicitado: ${cant}.`, 400);
        }

        const precioUnitario = Number(producto.precioVenta);
        if (isNaN(precioUnitario)) {
          throw new AppError(`Error de precio para el producto ${prodId}.`, 400);
        }

        // 2. Reservar Stock
        await tx.$executeRaw`
          UPDATE inv_stock_producto 
          SET stock_reservado = stock_reservado + ${cant} 
          WHERE producto_id = ${prodId}
        `;

        // 3. Acumular subtotales
        const subitem = precioUnitario * cant;
        subtotalProductos += subitem;

        itemsData.push({
          productoId: prodId,
          productoNombre: producto.nombre,
          sku: producto.sku,
          cantidad: cant,
          precioUnitario,
          subtotal: subitem
        });
      }

      // Redondear para evitar problemas de precisión de JavaScript (ej: 15.000000000000002)
      subtotalProductos = Math.round(subtotalProductos * 100) / 100;

      // Cálculos contables del Backend (No confiar en lo que envía el Frontend)
      const costoEnvio = 15.00; // El Backend controla el precio de envío real
      const baseImponible = Math.round((subtotalProductos + costoEnvio) * 100) / 100;
      const impuestoIgv = Math.round((baseImponible * 0.18) * 100) / 100;
      const total = Math.round((baseImponible + impuestoIgv) * 100) / 100;

      let estadoPendiente = await tx.ordEstadoOrden.findFirst({ where: { nombre: 'pendiente_pago' } });
      if (!estadoPendiente) {
        estadoPendiente = await tx.ordEstadoOrden.create({ data: { nombre: 'pendiente_pago' } });
      }

      // 4. Crear la Orden usando los cálculos seguros del Backend
      const orden = await tx.ordOrden.create({
        data: {
          clienteId: cliente.id,
          estadoId: estadoPendiente.id,
          metodoEnvioId: metodoEnvioId || 1,
          subtotal: subtotalProductos,
          costoEnvio,
          impuestoIgv,
          total,
          codigoOrden: `ORD-${Date.now().toString().slice(-8)}`, // Cortamos el timestamp para evitar desbordamientos
          items: { create: itemsData },
          direccionesEnvio: { 
            create: { 
              direccion: direccionEnvio?.direccion || 'Sin dirección', 
              ciudad: direccionEnvio?.ciudad || 'Lima' 
            } 
          }
        }
      });

      res.status(201).json({ 
        success: true, 
        data: { 
          ordenId: orden.id, 
          codigoOrden: orden.codigoOrden,
          // Devolvemos los números reales con los que se facturó para actualizar la UI
          facturacion: {
            subtotal: subtotalProductos,
            envio: costoEnvio,
            igv: impuestoIgv,
            total
          }
        }, 
        message: 'Orden creada exitosamente' 
      });
    }, { timeout: 20000 });

  } catch (error) { 
    // --- BLOQUE TEMPORAL PARA VER EL ERROR REAL ---
    console.error("❌❌❌ ERROR DETECTADO EN CHECKOUT ❌❌❌");
    console.error("Mensaje:", (error as any)?.message);
    console.error("Código Prisma:", (error as any)?.code);
    console.error("Stack Completo:", error);
    // -------------------------------------------
    
    next(error); 
  }
};

// backend/src/controllers/orden.controller.ts (Añadir al existente)

export const getMisOrdenes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Se asume que el token tiene el ID del usuario, y buscamos su cliente asociado
    const cliente = await prisma.cliCliente.findUnique({ where: { usuarioId: req.usuario!.id } });
    if (!cliente) throw new AppError('Perfil de cliente no encontrado', 404);

    const ordenes = await prisma.ordOrden.findMany({
      where: { clienteId: cliente.id },
      include: { estado: true, items: true },
      orderBy: { fechaCreacion: 'desc' }
    });
    res.json({ success: true, data: ordenes });
  } catch (error) { next(error); }
};

export const cambiarEstadoOrden = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ordenIdParam = req.params.ordenId ?? req.params.id;
    const ordenId = Number(ordenIdParam);
    if (isNaN(ordenId)) {
      throw new AppError('ID de orden inválido', 400);
    }

    const { nuevoEstadoId, nuevoEstado, comentario } = req.body;

    let estadoId: number;

    if (nuevoEstadoId) {
      estadoId = Number(nuevoEstadoId);
      if (isNaN(estadoId)) {
        throw new AppError('nuevoEstadoId inválido', 400);
      }
    } else if (nuevoEstado) {
      const estado = await prisma.ordEstadoOrden.findUnique({
        where: { nombre: nuevoEstado }
      });
      if (!estado) {
        throw new AppError(`Estado de orden '${nuevoEstado}' no encontrado`, 400);
      }
      estadoId = estado.id;
    } else {
      throw new AppError('Debe proporcionar nuevoEstadoId o nuevoEstado', 400);
    }

    if (!req.usuario) {
      throw new AppError('No autenticado', 401);
    }

    await prisma.$transaction(async (tx) => {
      await tx.ordOrden.update({
        where: { id: ordenId },
        data: { estadoId, fechaActualizacion: new Date() }
      });

      await tx.ordHistorialEstado.create({
        data: {
          ordenId,
          estadoId,
          comentario,
          creadoPor: req.usuario.id
        }
      });
    });

    res.json({ success: true, message: 'Estado de orden actualizado correctamente' });
  } catch (error) { next(error); }
};

export const listarOrdenesAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ordenes = await prisma.ordOrden.findMany({
      include: {
        estado: true,
        cliente: true,
        items: true,
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    res.json({ success: true, data: ordenes });
  } catch (error) {
    next(error);
  }
};

export const sincronizarCarritoBD = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) throw new AppError('No autenticado', 401);

    let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
    if (!cliente) {
      cliente = await prisma.cliCliente.create({ data: { usuarioId, razonSocial: 'Cliente Final' } });
    }

    let carrito = await prisma.ordCarrito.findFirst({ where: { clienteId: cliente.id } });
    if (!carrito) {
      carrito = await prisma.ordCarrito.create({ data: { clienteId: cliente.id } });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('El carrito enviado está vacío.', 400);
    }

    // Limpiar items viejos
    await prisma.ordItemCarrito.deleteMany({ where: { carritoId: carrito.id } });
    
    // Mapeo estricto: SOLO extraer productoId y cantidad. Ignorar precio, nombre, sku, etc.
    const datosLimpios = items.map((item: any) => {
      const prodId = Number(item.productoId);
      const cant = Number(item.cantidad);
      
      if (isNaN(prodId) || isNaN(cant) || cant <= 0) {
        throw new AppError(`Datos inválidos en un producto del carrito.`, 400);
      }

      return {
        carritoId: carrito.id,
        productoId: prodId,
        cantidad: cant
      };
    });

    // Validar stock disponible para todos los productos antes de sincronizar
    for (const item of datosLimpios) {
      const stockInfo = await prisma.invStockProducto.findUnique({ 
        where: { productoId: item.productoId },
        select: { stockFisico: true, stockReservado: true }
      });

      if (!stockInfo) {
        const producto = await prisma.catProducto.findUnique({ 
          where: { id: item.productoId },
          select: { nombre: true }
        });
        throw new AppError(`No se encontró información de stock para el producto ${producto?.nombre || item.productoId}.`, 400);
      }

      const stockDisponible = stockInfo.stockFisico - stockInfo.stockReservado;
      if (stockDisponible < item.cantidad) {
        const producto = await prisma.catProducto.findUnique({ 
          where: { id: item.productoId },
          select: { nombre: true }
        });
        throw new AppError(`Stock insuficiente para ${producto?.nombre || 'producto'}. Disponible: ${stockDisponible}, solicitado: ${item.cantidad}.`, 400);
      }
    }

    // Insertar en BD
    await prisma.ordItemCarrito.createMany({ data: datosLimpios });

    res.json({ success: true, message: 'Carrito sincronizado' });
  } catch (error) { 
    next(error); 
  }
};