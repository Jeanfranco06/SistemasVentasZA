// backend/src/controllers/ventas.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export const dashboardVentas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Métricas clave de ventas
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Tasa de conversión (órdenes completadas vs visitas/carritos)
    const ordenesCompletadas = await prisma.ordOrden.count({
      where: {
        estado: { nombre: 'pagada' },
        fechaCreacion: { gte: inicioMes, lte: finMes }
      }
    });

    // Ticket promedio
    const ticketPromedioResult = await prisma.ordOrden.aggregate({
      where: {
        estado: { nombre: 'pagada' },
        fechaCreacion: { gte: inicioMes, lte: finMes }
      },
      _avg: { total: true },
      _count: true
    });

    // Abandono de carrito (carritos con items pero sin orden)
    const carritosActivos = await prisma.ordCarrito.count({
      where: { items: { some: {} } }
    });

    const ordenesRecientes = await prisma.ordOrden.count({
      where: { fechaCreacion: { gte: inicioMes, lte: finMes } }
    });

    const tasaConversion = ordenesRecientes > 0 ? (ordenesCompletadas / ordenesRecientes) * 100 : 0;

    res.json({
      success: true,
      data: {
        tasaConversion: Math.round(tasaConversion * 100) / 100,
        ticketPromedio: ticketPromedioResult._avg.total || 0,
        abandonoCarrito: carritosActivos,
        ordenesMes: ordenesCompletadas
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listarOrdenesVentas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      estado,
      fechaDesde,
      fechaHasta,
      metodoPago,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {};

    if (estado) where.estado = { nombre: estado };
    if (fechaDesde || fechaHasta) {
      where.fechaCreacion = {};
      if (fechaDesde) where.fechaCreacion.gte = new Date(fechaDesde as string);
      if (fechaHasta) where.fechaCreacion.lte = new Date(fechaHasta as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const ordenes = await prisma.ordOrden.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, razonSocial: true, usuario: { select: { email: true } } }
        },
        estado: true,
        metodoEnvio: true,
        items: {
          include: {
            producto: { select: { nombre: true, sku: true } }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.ordOrden.count({ where });

    res.json({
      success: true,
      data: {
        ordenes,
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

export const cambiarEstadoOrden = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ordenId } = req.params;
    const { nuevoEstado } = req.body;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) throw new AppError('Usuario no autenticado', 401);

    // Validar transiciones permitidas para Gerente de Ventas
    const transicionesPermitidas: Record<string, string[]> = {
      'pendiente_pago': ['pagada'],
      'pagada': ['en_proceso', 'cancelada'],
      'en_proceso': ['enviada', 'cancelada'],
      'enviada': ['entregada'],
      'entregada': [],
      'cancelada': []
    };

    const orden = await prisma.ordOrden.findUnique({
      where: { id: Number(ordenId) },
      include: { estado: true }
    });

    if (!orden) throw new AppError('Orden no encontrada', 404);

    const estadoActual = orden.estado.nombre;
    if (!transicionesPermitidas[estadoActual]?.includes(nuevoEstado)) {
      throw new AppError(`Transición no permitida: ${estadoActual} → ${nuevoEstado}`, 400);
    }

    // Buscar el nuevo estado
    const estadoNuevo = await prisma.ordEstadoOrden.findFirst({
      where: { nombre: nuevoEstado }
    });

    if (!estadoNuevo) throw new AppError('Estado no válido', 400);

    // Actualizar la orden
    await prisma.ordOrden.update({
      where: { id: Number(ordenId) },
      data: { estadoId: estadoNuevo.id }
    });

    res.json({ success: true, message: 'Estado de orden actualizado correctamente' });
  } catch (error) { next(error); }
};

export const obtenerHistorialOrden = async (req: Request, res: Response, next: NextFunction) => {
  // Función simplificada: no se usa en la interfaz simplificada
  try {
    res.json({ success: true, data: [] });
  } catch (error) { next(error); }
};

export const perfilCliente = async (req: Request, res: Response, next: NextFunction) => {
  // Función simplificada: no se usa en la interfaz simplificada
  try {
    res.json({ success: true, data: {} });
  } catch (error) { next(error); }
};