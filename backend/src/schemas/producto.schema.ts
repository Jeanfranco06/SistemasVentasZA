// backend/src/schemas/producto.schema.ts
import { z } from 'zod';

export const productoSchema = z.object({
  sku: z.string().min(3).max(20),
  nombre: z.string().min(3).max(150),
  descripcion: z.string().optional(),
  imagenUrl: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().max(500).optional()
  ),
  categoriaId: z.number().int().positive(),
  subcategoriaId: z.number().int().positive().optional(),
  precioVenta: z.number().positive(),
  precioCosto: z.number().nonnegative().optional(),
  stockActual: z.number().int().nonnegative().optional(),
  stockMinimo: z.number().int().nonnegative().optional(),
  estado: z.enum(['borrador', 'activo', 'inactivo']).optional(),
  activo: z.boolean().default(true),
});

export type ProductoInput = z.infer<typeof productoSchema>;
