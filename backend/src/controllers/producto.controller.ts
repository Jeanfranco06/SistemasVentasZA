// backend/src/controllers/producto.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { generarSiguienteSku, validarCoherenciaSku } from '../services/producto.service';
import { productoSchema } from '../schemas/producto.schema';

const sincronizarImagenPrincipal = async (productoId: number, imagenUrl?: string) => {
  if (!imagenUrl) return;

  const imagenPrincipal = await prisma.catImagenProducto.findFirst({
    where: { productoId, orden: 0 }
  });

  if (imagenPrincipal) {
    await prisma.catImagenProducto.update({
      where: { id: imagenPrincipal.id },
      data: { urlImagen: imagenUrl }
    });
    return;
  }

  await prisma.catImagenProducto.create({
    data: { productoId, urlImagen: imagenUrl, orden: 0 }
  });
};

export const obtenerSiguienteSku = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoriaId = parseInt(req.query.categoriaId as string);
    if (!categoriaId) throw new AppError('categoriaId es requerido', 400);
    
    const sku = await generarSiguienteSku(categoriaId);
    res.json({ success: true, data: { sku }, message: 'SKU generado' });
  } catch (error) { next(error); }
};

export const crearProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validacion = productoSchema.safeParse(req.body);
    if (!validacion.success) {
      throw new AppError('Datos de producto inválidos: ' + JSON.stringify(validacion.error.format()), 400);
    }

    const { sku, categoriaId, precioVenta, nombre, descripcion, subcategoriaId, precioCosto, estado, activo, imagenUrl, stockActual, stockMinimo } = validacion.data;

    // REGLA DE NEGOCIO SKU: Validación de coherencia
    await validarCoherenciaSku(sku, categoriaId);

    const activoFinal = estado === 'inactivo' ? false : activo;

    const producto = await prisma.catProducto.create({
      data: {
        sku,
        nombre,
        imagenUrl,
        categoriaId,
        precioVenta,
        descripcion,
        subcategoriaId,
        precioCosto,
        estado,
        activo: activoFinal,
        creadoPor: req.usuario?.id
      }
    });

    // Inicializar stock
    await prisma.invStockProducto.create({
      data: { 
        productoId: producto.id,
        stockFisico: stockActual || 0,
        stockReservado: 0,
        stockMinimo: stockMinimo || 0
      }
    });

    await sincronizarImagenPrincipal(producto.id, imagenUrl);

    res.status(201).json({ success: true, data: producto, message: 'Producto creado' });
  } catch (error) { next(error); }
};

// backend/src/controllers/producto.controller.ts (Modificar listarProductosTienda)

// backend/src/controllers/producto.controller.ts (Modificar listarProductosTienda)

export const listarProductosTienda = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pagina = 1, limite = 12, busqueda, categoriaId, orden } = req.query;
    const skip = (Number(pagina) - 1) * Number(limite);

    const where: any = { activo: true, estado: 'activo' };
    
    // CORRECCIÓN: Buscar por nombre O por SKU
    if (busqueda) {
      where.OR = [
        { nombre: { contains: String(busqueda), mode: 'insensitive' } },
        { sku: { contains: String(busqueda), mode: 'insensitive' } }
      ];
    }
    
    if (categoriaId && categoriaId !== 'todas') where.categoriaId = Number(categoriaId);

    let orderBy: any = { fechaCreacion: 'desc' };
    if (orden === 'precio-asc') orderBy = { precioVenta: 'asc' };
    if (orden === 'precio-desc') orderBy = { precioVenta: 'desc' };
    if (orden === 'nombre-asc') orderBy = { nombre: 'asc' };

    const [total, data] = await Promise.all([
      prisma.catProducto.count({ where }),
      prisma.catProducto.findMany({
        where, skip, take: Number(limite),
        include: {
          catImagenesProducto: { where: { orden: 0 }, take: 1 },
          invStockProducto: { select: { stockFisico: true, stockReservado: true } },
          categoria: { select: { nombre: true } },
          catProductoAtributo: { include: { valorAtributo: { include: { atributo: true } } } }
        },
        orderBy
      })
    ]);

    res.json({ success: true, data: { total, page: Number(pagina), limit: Number(limite), data } });
  } catch (error) { next(error); }
};

// backend/src/controllers/producto.controller.ts (Añadir este método)

export const listarProductosAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busqueda } = req.query;
    const where: any = {};

    if (busqueda) {
      where.OR = [
        { nombre: { contains: String(busqueda), mode: 'insensitive' } },
        { sku: { contains: String(busqueda), mode: 'insensitive' } },
      ];
    }

    const data = await prisma.catProducto.findMany({
      where,
      include: {
        categoria: { select: { nombre: true } },
        catImagenesProducto: { where: { orden: 0 }, take: 1 }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    res.json({ success: true, data: { total: data.length, data } });
  } catch (error) { next(error); }
};

// backend/src/controllers/producto.controller.ts (Añadir método update)
export const obtenerProductoPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const producto = await prisma.catProducto.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        categoria: true,
        marca: true,
        catImagenesProducto: { where: { orden: 0 }, take: 1 },
        invStockProducto: true
      }
    });
    if (!producto) throw new AppError('Producto no encontrado', 404);
    res.json({ success: true, data: producto });
  } catch (error) { next(error); }
};

export const actualizarProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validacion = productoSchema.partial().safeParse(req.body);
    if (!validacion.success) {
      throw new AppError('Datos de producto inválidos: ' + JSON.stringify(validacion.error.format()), 400);
    }

    const { sku, categoriaId, nombre, descripcion, subcategoriaId, precioCosto, precioVenta, estado, activo, imagenUrl, stockActual, stockMinimo } = validacion.data;
    if (sku && categoriaId) {
      await validarCoherenciaSku(sku, categoriaId); // Mantenemos la regla de negocio
    }

    const productoActual = await prisma.catProducto.findUnique({
      where: { id: Number(id) },
      select: { activo: true }
    });
    if (!productoActual) {
      throw new AppError('Producto no encontrado', 404);
    }

    const activoFinal = estado === 'inactivo'
      ? false
      : estado === 'activo'
        ? true
        : activo ?? productoActual.activo;

    await prisma.catProducto.update({
      where: { id: Number(id) },
      data: {
        sku,
        categoriaId,
        nombre,
        imagenUrl,
        descripcion,
        subcategoriaId,
        precioCosto,
        precioVenta,
        estado,
        activo: activoFinal,
        fechaActualizacion: new Date()
      }
    });

    // Actualizar stock si se proporcionaron valores
    if (stockActual !== undefined || stockMinimo !== undefined) {
      await prisma.invStockProducto.upsert({
        where: { productoId: Number(id) },
        update: {
          stockFisico: stockActual,
          stockMinimo: stockMinimo
        },
        create: {
          productoId: Number(id),
          stockFisico: stockActual || 0,
          stockReservado: 0,
          stockMinimo: stockMinimo || 0
        }
      });
    }

    await sincronizarImagenPrincipal(Number(id), imagenUrl);

    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) { next(error); }
};

export const eliminarProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('Id de producto inválido', 400);
    }

    const producto = await prisma.catProducto.findUnique({
      where: { id },
      select: { id: true, activo: true, estado: true }
    });

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    if (!producto.activo && producto.estado === 'inactivo') {
      throw new AppError('El producto ya estaba desactivado', 400);
    }

    await prisma.catProducto.update({
      where: { id },
      data: {
        activo: false,
        estado: 'inactivo',
        fechaActualizacion: new Date()
      }
    });

    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) { next(error); }
};

// backend/src/controllers/proveedor.controller.ts

export const eliminarProveedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proveedorId = Number(req.params.id);

    // VALIDACIÓN COMERCIAL: Verificar si tiene Órdenes de Compra PENDIENTES/PARCIALES
    const ordenesActivas = await prisma.invOrdenCompra.count({
      where: { 
        proveedorId, 
        estado: { in: ['pendiente', 'parcial'] } 
      }
    });

    if (ordenesActivas > 0) {
      throw new AppError(`No se puede desactivar: Tiene ${ordenesActivas} órdenes de compra pendientes.`, 400);
    }

    // ELIMINACIÓN LÓGICA
    await prisma.invProveedor.update({
      where: { id: proveedorId },
      data: { activo: false }
    });

    res.json({ success: true, message: 'Proveedor desactivado correctamente' });
  } catch (error) { next(error); }
};

export const obtenerStockProductos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productoIds } = req.body;

    if (!productoIds || !Array.isArray(productoIds) || productoIds.length === 0) {
      throw new AppError('Se requiere un array de productoIds', 400);
    }

    // Obtener información de stock para los productos solicitados
    const stocks = await prisma.invStockProducto.findMany({
      where: {
        productoId: { in: productoIds }
      },
      select: {
        productoId: true,
        stockFisico: true,
        stockReservado: true,
        producto: {
          select: {
            nombre: true,
            sku: true,
            precioVenta: true
          }
        }
      }
    });

    // Calcular stock disponible y formatear respuesta
    const stockInfo = stocks.map(stock => ({
      productoId: stock.productoId,
      nombre: stock.producto.nombre,
      sku: stock.producto.sku,
      precioVenta: stock.producto.precioVenta,
      stockFisico: stock.stockFisico,
      stockReservado: stock.stockReservado,
      stockDisponible: stock.stockFisico - stock.stockReservado
    }));

    res.json({ success: true, data: stockInfo });
  } catch (error) { next(error); }
};

export const cambiarEstadoProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productoId = Number(req.params.id);
    const { estado } = req.body;

    if (!estado || !['activo', 'inactivo'].includes(estado)) {
      throw new AppError('Estado inválido. Debe ser "activo" o "inactivo"', 400);
    }

    // Verificar que el producto existe
    const producto = await prisma.catProducto.findUnique({
      where: { id: productoId }
    });

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Actualizar el estado del producto
    const productoActualizado = await prisma.catProducto.update({
      where: { id: productoId },
      data: {
        estado,
        activo: estado === 'activo',
        fechaActualizacion: new Date()
      }
    });

    res.json({
      success: true,
      data: productoActualizado,
      message: `Producto ${estado === 'activo' ? 'activado' : 'desactivado'} correctamente`
    });
  } catch (error) { next(error); }
};