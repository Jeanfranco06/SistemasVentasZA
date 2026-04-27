// backend/src/services/orden.service.ts
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

const prisma = new PrismaClient();

export const confirmarPagoYDescontarStock = async (ordenId: number, usuarioId: number) => {
  // Usamos Transacción Interactiva para mantener el bloqueo durante todo el proceso
  await prisma.$transaction(async (tx) => {
    
    // 1. Obtener items de la orden
    const itemsOrden = await tx.ordItemOrden.findMany({
      where: { ordenId },
    });

    if (!itemsOrden.length) throw new AppError('La orden no tiene items', 400);

    // 2. Bloqueo Pesimista y Validación de Stock
    for (const item of itemsOrden) {
      // SELECT ... FOR UPDATE nativo de PostgreSQL mediante Prisma Raw
      const stock = await tx.$queryRaw<Array<{ stock_fisico: number; stock_reservado: number }>>`
        SELECT stock_fisico, stock_reservado 
        FROM inv_stock_producto 
        WHERE producto_id = ${item.productoId} 
        FOR UPDATE
      `;

      const stockActual = stock[0];

      if (!stockActual) {
        throw new AppError(`Producto ID ${item.productoId} no tiene registro de inventario`, 500);
      }

      const stockDisponible = stockActual.stock_fisico - stockActual.stock_reservado;

      // VALIDACIÓN CRÍTICA DE RACE CONDITION
      if (stockDisponible < item.cantidad) {
        throw new AppError(
          `Stock insuficiente para el producto ${item.productoNombre}. Disponible: ${stockDisponible}`,
          409 // 409 Conflict es el status code semánticamente correcto para race conditions
        );
      }
    }

    // 3. Si todo es válido, proceder con el descuento físico y liberación del reservado
    for (const item of itemsOrden) {
      await tx.$executeRaw`
        UPDATE inv_stock_producto 
        SET 
          stock_fisico = stock_fisico - ${item.cantidad},
          stock_reservado = stock_reservado - ${item.cantidad},
          fecha_actualizacion = NOW()
        WHERE producto_id = ${item.productoId}
      `;
      
      // Registrar movimiento
      await tx.invMovimientoInventario.create({
        data: {
          productoId: item.productoId,
          tipoMovimiento: 'salida',
          cantidad: item.cantidad,
          motivo: 'Venta orden',
          referenciaId: ordenId,
          creadoPor: usuarioId,
        }
      });
    }

    // 4. Actualizar estado de la orden
    const estadoPagada = await tx.ordEstadoOrden.findFirst({ where: { nombre: 'pagada' } });
    await tx.ordOrden.update({
      where: { id: ordenId },
      data: { estadoId: estadoPagada!.id },
    });

    await tx.ordHistorialEstado.create({
      data: {
        ordenId,
        estadoId: estadoPagada!.id,
        comentario: 'Pago confirmado y stock descontado',
        creadoPor: usuarioId,
      }
    });

  }, {
    // Timeout de la transacción (15 segundos por defecto, configurable)
    timeout: 15000, 
  });
};