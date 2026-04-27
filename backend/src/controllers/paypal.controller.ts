// backend/src/controllers/paypal.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { crearOrdenPayPal, capturarOrdenPayPal, obtenerDetallesOrdenPayPal } from '../services/paypal.service.js';
import { confirmarPagoYDescontarStock } from '../services/orden.service.js';

const prisma = new PrismaClient();

/**
 * Crear orden de PayPal basada en una orden interna
 */
export const crearOrdenPayPalController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ordenInternalId } = req.body;
    if (!ordenInternalId) throw new AppError('ID de orden requerido', 400);

    // Obtener la orden interna
    const orden = await prisma.ordOrden.findUnique({
      where: { id: ordenInternalId },
      include: { cliente: true, estado: true, pagos: true },
    });

    if (!orden) throw new AppError('Orden no encontrada', 404);
    if (orden.estado?.nombre !== 'pendiente_pago') {
      throw new AppError('La orden no está en estado pendiente de pago', 400);
    }

    const montoEnUSD = Number(orden.total) / 3.7;
    const ordenPayPal = await crearOrdenPayPal(montoEnUSD, orden.codigoOrden);

    if (!orden.pagos?.length) {
      await prisma.ordPago.create({
        data: {
          ordenId: orden.id,
          metodo: 'paypal',
          estado: 'pendiente'
        }
      });
    } else {
      await prisma.ordPago.update({
        where: { ordenId: orden.id },
        data: {
          metodo: 'paypal',
          estado: 'pendiente'
        }
      });
    }

    res.json({
      success: true,
      data: {
        paypalOrderId: ordenPayPal.id,
        approvalUrl: ordenPayPal.links?.find((link: any) => link.rel === 'approve')?.href,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Capturar pago después de que usuario aprueba en PayPal
 */
export const capturarPagoPayPal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paypalOrderId, ordenInternalId } = req.body;
    if (!paypalOrderId || !ordenInternalId) throw new AppError('Parámetros requeridos', 400);

    // Obtener detalles de la orden de PayPal
    const detallesPayPal = await capturarOrdenPayPal(paypalOrderId);
    
    if (detallesPayPal.status !== 'COMPLETED') {
      throw new AppError('Pago no completado en PayPal', 400);
    }

    // Actualizar la orden interna
    const orden = await prisma.ordOrden.findUnique({
      where: { id: ordenInternalId },
      include: { pagos: true }
    });

    if (!orden) throw new AppError('Orden no encontrada', 404);

    let pago = orden.pagos?.[0];
    if (!pago) {
      pago = await prisma.ordPago.create({
        data: {
          ordenId: orden.id,
          metodo: 'paypal',
          estado: 'pendiente'
        }
      });
    }

    await prisma.ordTransaccionPago.create({
      data: {
        pagoId: pago.id,
        estado: 'completado',
        monto: orden.total,
        respuestaJson: detallesPayPal as any,
      },
    });

    await prisma.ordPago.update({
      where: { id: pago.id },
      data: { estado: 'completado' }
    });

    // Confirmar pago y descontar stock
    const usuarioId = req.usuario?.id;
    if (!usuarioId) throw new AppError('No autenticado', 401);

    await confirmarPagoYDescontarStock(orden.id, usuarioId);

    res.json({
      success: true,
      message: 'Pago capturado exitosamente',
      data: {
        ordenId: orden.id,
        codigoOrden: orden.codigoOrden,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar estado de pago de PayPal
 */
export const verificarEstadoPago = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paypalOrderId } = req.query;
    if (!paypalOrderId) throw new AppError('Order ID requerido', 400);

    const detalles: any = await obtenerDetallesOrdenPayPal(paypalOrderId as string);

    res.json({
      success: true,
      data: {
        status: detalles.status,
        payerEmail: detalles.payer?.email_address,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Probar conexión con PayPal
 */
export const probarPayPal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Intentar crear una orden de prueba con monto mínimo
    const ordenPayPal = await crearOrdenPayPal(0.01, 'TEST-ORDER');

    res.json({
      success: true,
      message: 'Conexión con PayPal exitosa',
      data: {
        orderId: ordenPayPal.id,
        status: ordenPayPal.status,
      },
    });
  } catch (error: any) {
    console.error('Error probando PayPal:', error);
    res.status(500).json({
      success: false,
      message: 'Error conectando con PayPal',
      error: error.message,
    });
  }
};
