// backend/src/controllers/inventario.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export const dashboardInventario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Productos con stock bajo
    const productosStockBajo = await prisma.invStockProducto.findMany({
      where: {
        OR: [
          { stockFisico: { lte: prisma.invStockProducto.fields.stockMinimo } },
          { stockFisico: 0 }
        ]
      },
      include: {
        producto: { select: { nombre: true, sku: true } }
      }
    });

    // Estadísticas generales
    const totalProductos = await prisma.catProducto.count({ where: { activo: true } });
    const productosActivos = await prisma.catProducto.count({ where: { estado: 'activo' } });
    const productosInactivos = await prisma.catProducto.count({ where: { estado: 'inactivo' } });

    // Órdenes de compra pendientes
    const ordenesPendientes = await prisma.invOrdenCompra.count({
      where: {
        estado: { in: ['pendiente', 'parcial'] }
      }
    });

    res.json({
      success: true,
      data: {
        alertas: {
          stockBajo: productosStockBajo.length,
          productosStockBajo: productosStockBajo.slice(0, 5) // Top 5
        },
        estadisticas: {
          totalProductos,
          productosActivos,
          productosInactivos,
          ordenesCompraPendientes: ordenesPendientes
        }
      }
    });
  } catch (error) { next(error); }
};

export const crearProductoDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, sku, descripcion, categoriaId } = req.body;

    // NO permitir modificar precios (restricción del rol)
    const producto = await prisma.catProducto.create({
      data: {
        nombre,
        sku,
        descripcion,
        categoriaId: Number(categoriaId),
        estado: 'borrador',
        activo: false
      }
    });

    // Crear registro de stock inicial
    await prisma.invStockProducto.create({
      data: {
        productoId: producto.id,
        stockFisico: 0,
        stockReservado: 0,
        stockMinimo: 5
      }
    });

    res.status(201).json({ success: true, data: producto });
  } catch (error) { next(error); }
};

export const publicarProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const producto = await prisma.catProducto.findUnique({
      where: { id: Number(id) }
    });

    if (!producto) throw new AppError('Producto no encontrado', 404);
    if (producto.estado !== 'borrador') throw new AppError('Solo se pueden publicar productos en borrador', 400);

    await prisma.catProducto.update({
      where: { id: Number(id) },
      data: {
        estado: 'activo',
        activo: true
      }
    });

    res.json({ success: true, message: 'Producto publicado correctamente' });
  } catch (error) { next(error); }
};

export const descontinuarProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.catProducto.update({
      where: { id: Number(id) },
      data: {
        estado: 'inactivo',
        activo: false
      }
    });

    res.json({ success: true, message: 'Producto descontinuado correctamente' });
  } catch (error) { next(error); }
};

export const ajustarStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productoId, tipo, cantidad, motivo } = req.body;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) throw new AppError('Usuario no autenticado', 401);

    if (!['entrada', 'salida', 'merma'].includes(tipo)) {
      throw new AppError('Tipo de ajuste no válido', 400);
    }

    let ajusteStock = cantidad;
    if (tipo === 'salida' || tipo === 'merma') {
      ajusteStock = -cantidad;
    }

    await prisma.$executeRaw`
      UPDATE inv_stock_producto
      SET stock_fisico = GREATEST(stock_fisico + ${ajusteStock}, 0)
      WHERE producto_id = ${productoId}
    `;

    await prisma.invMovimientoInventario.create({
      data: {
        productoId: Number(productoId),
        tipoMovimiento: tipo,
        cantidad: Math.abs(cantidad),
        motivo: motivo || `Ajuste manual por ${tipo}`,
        creadoPor: usuarioId
      }
    });

    res.json({ success: true, message: 'Stock ajustado correctamente' });
  } catch (error) { next(error); }
};

export const historialStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productoId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const movimientos = await prisma.invMovimientoInventario.findMany({
      where: { productoId: Number(productoId) },
      include: {
        creadoPorUser: { select: { nombreCompleto: true } }
      },
      orderBy: { fechaCreacion: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.invMovimientoInventario.count({
      where: { productoId: Number(productoId) }
    });

    res.json({
      success: true,
      data: {
        movimientos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) { next(error); }
};

export const crearOrdenCompra = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { proveedorId, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Debe incluir al menos un item en la orden de compra', 400);
    }

    const ordenCompra = await prisma.invOrdenCompra.create({
      data: {
        proveedorId: Number(proveedorId),
        estado: 'pendiente',
        detalles: {
          create: items.map((item: any) => ({
            productoId: Number(item.productoId),
            cantidadPedida: Number(item.cantidad),
            costoUnitario: Number(item.precioUnitario)
          }))
        }
      },
      include: {
        proveedor: { select: { razonSocial: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true, sku: true } }
          }
        }
      }
    });

    res.status(201).json({ success: true, data: ordenCompra });
  } catch (error) { next(error); }
};

export const recibirMercaderia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ordenCompraId, recepciones } = req.body;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) throw new AppError('Usuario no autenticado', 401);

    const ordenCompra = await prisma.invOrdenCompra.findUnique({
      where: { id: Number(ordenCompraId) },
      include: { detalles: true }
    });

    if (!ordenCompra) throw new AppError('Orden de compra no encontrada', 404);

    for (const recepcion of recepciones) {
      const item = ordenCompra.detalles.find(i => i.productoId === recepcion.productoId);
      if (!item) continue;

      await prisma.$executeRaw`
        UPDATE inv_stock_producto
        SET stock_fisico = stock_fisico + ${recepcion.cantidadRecibida}
        WHERE producto_id = ${recepcion.productoId}
      `;

      // TODO: Implementar recepción de mercadería
      /*
      await prisma.invRecepcionCompra.create({
        data: {
          ordenCompraId: Number(ordenCompraId),
          productoId: recepcion.productoId,
          cantidadRecibida: recepcion.cantidadRecibida,
          usuarioId
        }
      });

      await prisma.invItemOrdenCompra.update({
        where: { ordenCompraId_productoId: { ordenCompraId: Number(ordenCompraId), productoId: recepcion.productoId } },
        data: {
          cantidadRecibida: {
            increment: recepcion.cantidadRecibida
          }
        }
      });
      */
    }

    // TODO: Implementar lógica de recepción completa
    /*
    const itemsActualizados = await prisma.invItemOrdenCompra.findMany({
      where: { ordenCompraId: Number(ordenCompraId) }
    });

    const ordenCompleta = itemsActualizados.every(
      item => item.cantidadRecibida >= item.cantidadSolicitada
    );

    if (ordenCompleta) {
      await prisma.invOrdenCompra.update({
        where: { id: Number(ordenCompraId) },
        data: { estado: 'completada' }
      });
    } else {
      await prisma.invOrdenCompra.update({
        where: { id: Number(ordenCompraId) },
        data: { estado: 'parcial' }
      });
    }
    */

    res.json({ success: true, message: 'Mercadería recibida correctamente' });
  } catch (error) { next(error); }
};

// CRUD Proveedores
export const listarProveedores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proveedores = await prisma.invProveedor.findMany({
      where: { activo: true },
      orderBy: { razonSocial: 'asc' }
    });

    res.json({ success: true, data: proveedores });
  } catch (error) { next(error); }
};

export const crearProveedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruc, razonSocial, contacto, telefono, email, direccion } = req.body;

    const proveedor = await prisma.invProveedor.create({
      data: {
        ruc,
        razonSocial,
        contacto,
        activo: true
      }
    });

    res.status(201).json({ success: true, data: proveedor });
  } catch (error) { next(error); }
};

export const actualizarProveedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { ruc, razonSocial, contacto, telefono, email, direccion } = req.body;

    const proveedor = await prisma.invProveedor.update({
      where: { id: Number(id) },
      data: { ruc, razonSocial, contacto }
    });

    res.json({ success: true, data: proveedor });
  } catch (error) { next(error); }
};

export const eliminarProveedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proveedorId = Number(req.params.id);

    const ordenesActivas = await prisma.invOrdenCompra.count({
      where: {
        proveedorId,
        estado: { in: ['pendiente', 'parcial'] }
      }
    });

    if (ordenesActivas > 0) {
      throw new AppError(`No se puede desactivar: Tiene ${ordenesActivas} órdenes de compra pendientes.`, 400);
    }

    await prisma.invProveedor.update({
      where: { id: proveedorId },
      data: { activo: false }
    });

    res.json({ success: true, message: 'Proveedor desactivado correctamente' });
  } catch (error) { next(error); }
};