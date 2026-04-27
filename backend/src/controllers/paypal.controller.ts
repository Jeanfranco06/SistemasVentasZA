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
      include: { cliente: true },
    });

    if (!orden) throw new AppError('Orden no encontrada', 404);
    if (orden.estado.id !== 1) throw new AppError('La orden no está en estado pendiente', 400);

    // Crear orden en PayPal
    const montoEnUSD = Number(orden.total) / 3.7; // Conversión PEN a USD
    const ordenPayPal = await crearOrdenPayPal(montoEnUSD, orden.codigoOrden);

    // Guardar el ID de PayPal en la BD
    await prisma.ordPago.update({
      where: { ordenId: orden.id },
      data: {
        metodo: 'paypal',
        estado: 'pendiente',
      },
    });

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
    });

    if (!orden) throw new AppError('Orden no encontrada', 404);

    // Registrar la transacción
    await prisma.ordTransaccionPago.create({
      data: {
        pagoId: orden.pagos[0]?.id || 1,
        estado: 'completado',
        monto: orden.total,
        respuestaJson: detallesPayPal as any,
      },
    });

    // Confirmar pago y descontar stock
    await confirmarPagoYDescontarStock(orden.id);

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

    const detalles = await obtenerDetallesOrdenPayPal(paypalOrderId as string);

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
