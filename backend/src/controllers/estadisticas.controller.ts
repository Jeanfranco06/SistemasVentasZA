// backend/src/controllers/estadisticas.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

// ANÁLISIS ABC DE PRODUCTOS
export const analisisABC = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = await prisma.$queryRaw`
      WITH VentasProducto AS (
          SELECT 
              p.id AS producto_id,
              p.nombre,
              SUM(oi.subtotal) AS ingreso_total
          FROM cat_productos p
          JOIN ord_items_orden oi ON p.id = oi.producto_id
          JOIN ord_ordenes o ON oi.orden_id = o.id
          WHERE o.estado_id IN (SELECT id FROM ord_estados_orden WHERE nombre IN ('pagada'))
          GROUP BY p.id, p.nombre
      ),
      Totales AS (
          SELECT SUM(ingreso_total) AS ingreso_global FROM VentasProducto
      ),
      Clasificacion AS (
          SELECT 
              vp.*,
              (vp.ingreso_total * 100.0 / NULLIF(t.ingreso_global, 0)) AS porcentaje,
              SUM(vp.ingreso_total) OVER (ORDER BY vp.ingreso_total DESC) * 100.0 / NULLIF(t.ingreso_global, 0) AS porcentaje_acumulado
          FROM VentasProducto vp, Totales t
      )
      SELECT 
          producto_id, nombre, ingreso_total, porcentaje,
          CASE 
              WHEN porcentaje_acumulado <= 80 THEN 'A'
              WHEN porcentaje_acumulado <= 95 THEN 'B'
              ELSE 'C'
          END AS categoria_abc
      FROM Clasificacion
      ORDER BY ingreso_total DESC;
    `;

    res.json({ success: true, data: datos });
  } catch (error) { next(error); }
};

// ANÁLISIS RFM DE CLIENTES
export const analisisRFM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = await prisma.$queryRaw`
      WITH ClienteDatos AS (
          SELECT 
              c.id AS cliente_id,
              c.razon_social,
              MAX(o.fecha_creacion) AS ultima_compra,
              COUNT(o.id) AS frecuencia,
              SUM(o.total) AS valor_monetario
          FROM cli_clientes c
          JOIN ord_ordenes o ON c.id = o.cliente_id
          WHERE o.estado_id IN (SELECT id FROM ord_estados_orden WHERE nombre IN ('pagada'))
          GROUP BY c.id, c.razon_social
      ),
      Puntuaciones AS (
          SELECT 
              *,
              NTILE(4) OVER (ORDER BY ultima_compra ASC) AS R,
              NTILE(4) OVER (ORDER BY frecuencia DESC) AS F,
              NTILE(4) OVER (ORDER BY valor_monetario DESC) AS M
          FROM ClienteDatos
      )
      SELECT 
          cliente_id, razon_social, ultima_compra, frecuencia, valor_monetario, R, F, M,
          (R + F + M) AS score_rfm,
          CASE 
              WHEN (R + F + M) >= 10 THEN 'VIP'
              WHEN (R + F + M) >= 7 THEN 'Leal'
              WHEN (R + F + M) >= 4 THEN 'Potencial'
              ELSE 'En Riesgo'
          END AS segmento_rfm
      FROM Puntuaciones
      ORDER BY score_rfm DESC;
    `;

    res.json({ success: true, data: datos });
  } catch (error) { next(error); }
};

const toNumber = (value: Prisma.Decimal | number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};

const toJsonSafe = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === 'bigint' ? Number(currentValue) : currentValue
    )
  ) as T;

export const resumenEstadisticas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioSiguienteMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    const inicioRangoVentas = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    const inicioRangoCarritos = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 30);

    const [
      ordenesMes,
      totalCarritosConItems,
      ingresosCategorias,
      ventasTiempo,
      carritosActivos,
      rfmDatos,
    ] = await Promise.all([
      prisma.ordOrden.findMany({
        where: {
          fechaCreacion: {
            gte: inicioMes,
            lt: inicioSiguienteMes,
          },
        },
        select: {
          total: true,
          estado: {
            select: {
              nombre: true,
            },
          },
        },
      }),
      // Count all carts that have items (potential conversions) - not limited to current month
      prisma.ordCarrito.findMany({
        where: {
          items: {
            some: {},
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.$queryRaw<Array<{ id: number; nombre: string; ingresos: Prisma.Decimal }>>`
        SELECT
          c.id,
          c.nombre,
          COALESCE(SUM(oi.subtotal), 0) AS ingresos
        FROM cat_categorias c
        JOIN cat_productos p ON p.categoria_id = c.id
        JOIN ord_items_orden oi ON oi.producto_id = p.id
        GROUP BY c.id, c.nombre
        ORDER BY ingresos DESC
        LIMIT 5
      `,
      prisma.$queryRaw<Array<{ ano: number; mes: number; ventas: Prisma.Decimal }>>`
        SELECT
          EXTRACT(YEAR FROM o.fecha_creacion)::int AS ano,
          EXTRACT(MONTH FROM o.fecha_creacion)::int AS mes,
          COALESCE(SUM(o.total), 0) AS ventas
        FROM ord_ordenes o
        GROUP BY EXTRACT(YEAR FROM o.fecha_creacion), EXTRACT(MONTH FROM o.fecha_creacion)
        ORDER BY ano ASC, mes ASC
      `,
      prisma.ordCarrito.count({
        where: {
          fechaCreacion: {
            gte: inicioRangoCarritos,
          },
          items: {
            some: {},
          },
        },
      }),
      // RFM Analysis - Calculate days since last purchase for Recency
      prisma.$queryRaw<Array<{
        cliente_id: number;
        razon_social: string | null;
        dias_desde_ultima_compra: number;
        frecuencia: number;
        valor_monetario: number;
        R: number;
        F: number;
        M: number;
        score_rfm: number;
        segmento_rfm: string;
      }>>`
        WITH ClienteDatos AS (
          SELECT
            c.id AS cliente_id,
            c.razon_social,
            MAX(o.fecha_creacion) AS ultima_compra,
            COUNT(o.id) AS frecuencia,
            COALESCE(SUM(o.total), 0) AS valor_monetario
          FROM cli_clientes c
          JOIN ord_ordenes o ON c.id = o.cliente_id
          WHERE o.estado_id IN (SELECT id FROM ord_estados_orden WHERE nombre IN ('pagada', 'en_proceso', 'completada'))
          GROUP BY c.id, c.razon_social
        ),
        ClienteConRecencia AS (
          SELECT
            *,
            EXTRACT(DAYS FROM CURRENT_DATE - ultima_compra)::int AS dias_desde_ultima_compra
          FROM ClienteDatos
        ),
        Puntuaciones AS (
          SELECT
            *,
            NTILE(4) OVER (ORDER BY dias_desde_ultima_compra DESC) AS R,
            NTILE(4) OVER (ORDER BY frecuencia DESC) AS F,
            NTILE(4) OVER (ORDER BY valor_monetario DESC) AS M
          FROM ClienteConRecencia
        )
        SELECT
          cliente_id,
          razon_social,
          dias_desde_ultima_compra,
          frecuencia,
          valor_monetario::numeric AS valor_monetario,
          R,
          F,
          M,
          (R + F + M) AS score_rfm,
          CASE
            WHEN (R + F + M) >= 10 THEN 'VIP'
            WHEN (R + F + M) >= 7 THEN 'Leal'
            WHEN (R + F + M) >= 4 THEN 'Potencial'
            ELSE 'En Riesgo'
          END AS segmento_rfm
        FROM Puntuaciones
        ORDER BY score_rfm DESC;
      `,
    ]);

    const ventasMes = ordenesMes.reduce(
      (acc, orden) => {
        acc.total_ordenes += 1;
        acc.total_ventas += toNumber(orden.total);
        return acc;
      },
      { total_ordenes: 0, total_ventas: 0 }
    );

    const ticket_promedio = ventasMes.total_ventas > 0 && ventasMes.total_ordenes > 0
      ? ventasMes.total_ventas / ventasMes.total_ordenes
      : 0;

    const estadosOrdenes = await prisma.$queryRaw<Array<{ estado: string; cantidad: number }>>`
      SELECT
        e.nombre AS estado,
        COUNT(*)::int AS cantidad
      FROM ord_ordenes o
      JOIN ord_estados_orden e ON e.id = o.estado_id
      GROUP BY e.nombre
      ORDER BY cantidad DESC
    `;

    const totalOrdenesMes = ventasMes.total_ordenes;
    const totalCarritos = totalCarritosConItems.length;
    const tasaConversion = totalCarritos > 0 ? (totalOrdenesMes / totalCarritos) * 100 : 0;
    const carritosAbandonados = Math.max(totalCarritos - totalOrdenesMes, 0);

    const payload = {
      ventasMes: {
        total_ordenes: totalOrdenesMes,
        total_ventas: Number(ventasMes.total_ventas.toFixed(2)),
        ticket_promedio: Number(ticket_promedio.toFixed(2)),
      },
      ingresosCategorias: ingresosCategorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        ingresos: Number(toNumber(categoria.ingresos).toFixed(2)),
      })),
      estadosOrdenes,
      tasaConversion: Number(tasaConversion.toFixed(2)),
      carritosAbandonados,
      ventasTiempo: ventasTiempo.map((item) => ({
        año: item.ano,
        mes: item.mes,
        ventas: Number(toNumber(item.ventas).toFixed(2)),
      })),
      carritosActivos,
      rfmDatos,
    };

    res.json({
      success: true,
      data: toJsonSafe(payload),
    });
  } catch (error) {
    console.error('[resumenEstadisticas] Error general:', error);
    next(error);
  }
};
