// backend/src/services/producto.service.ts
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

const prisma = new PrismaClient();

export const generarSiguienteSku = async (categoriaId: number): Promise<string> => {
  const categoria = await prisma.catCategoria.findUnique({
    where: { id: categoriaId },
    select: { prefijoSku: true },
  });

  if (!categoria) throw new AppError('Categoría no encontrada', 404);

  const prefijo = categoria.prefijoSku;

  const productosCategoria = await prisma.catProducto.findMany({
    where: { sku: { startsWith: `${prefijo}-` } },
    select: { sku: true },
  });

  // Solo tomamos SKUs con formato estándar de 3 dígitos (ej: ELE-001)
  // para evitar que valores atípicos (ELE-1001) distorsionen la vista previa.
  const skuRegex = new RegExp(`^${prefijo}-(\\d{3})$`);
  const maxSecuencial = productosCategoria.reduce((acc, producto) => {
    const match = producto.sku.match(skuRegex);
    if (!match) return acc;
    const correlativo = Number(match[1]);
    return Number.isNaN(correlativo) ? acc : Math.max(acc, correlativo);
  }, 0);

  const siguienteSecuencial = maxSecuencial + 1;

  return `${prefijo}-${siguienteSecuencial.toString().padStart(3, '0')}`;
};

export const validarCoherenciaSku = async (sku: string, categoriaId: number): Promise<void> => {
  const categoria = await prisma.catCategoria.findUnique({
    where: { id: categoriaId },
    select: { prefijoSku: true },
  });

  if (!categoria) throw new AppError('Categoría no encontrada', 404);

  const prefijoExtraido = sku.split('-')[0];
  
  if (prefijoExtraido !== categoria.prefijoSku) {
    throw new AppError(
      `El prefijo del SKU no corresponde a la categoría seleccionada. Esperado: ${categoria.prefijoSku}-`,
      400
    );
  }
};