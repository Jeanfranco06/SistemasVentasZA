// backend/src/middlewares/errorHandler.ts
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { Response } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // CAPTURA EXACTA DE RESTRICCIONES RESTRICT DE POSTGRESQL
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      // Inspeccionar el meta para saber de qué tabla viene
      const tableName = err.meta?.table_name as string || 'el registro';
      let userMessage = `No se puede eliminar: Tiene registros asociados en ${tableName}.`;
      
      // Personalización exacta según el requerimiento
      if (tableName === 'cat_productos') {
         userMessage = "No se puede eliminar: Tiene productos asociados.";
      } else if (tableName === 'inv_ordenes_compra') {
         userMessage = "No se puede eliminar: Tiene órdenes de compra asociadas.";
      }

      return res.status(400).json({
        success: false,
        message: userMessage,
      });
    }

    if (err.code === 'P2002') {
      const field = err.meta?.target as string[] | string;
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con el valor proporcionado para: ${field}`,
      });
    }
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};