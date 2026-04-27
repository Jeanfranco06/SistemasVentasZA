// backend/src/__tests__/producto.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { validarCoherenciaSku } from '../services/producto.service.js';
import prisma from '../lib/prisma.js';

vi.mock('../lib/prisma', () => ({
  default: {
    catCategoria: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Producto Service', () => {
  describe('validarCoherenciaSku', () => {
    it('debe lanzar error si el SKU no coincide con el prefijo de la categoría', async () => {
      (prisma.catCategoria.findUnique as any).mockResolvedValue({ prefijoSku: 'LAP' });
      
      await expect(validarCoherenciaSku('CEL-001', 1))
        .rejects.toThrow('El SKU CEL-001 no coincide con el prefijo LAP de la categoría');
    });

    it('debe pasar si el SKU coincide con el prefijo', async () => {
      (prisma.catCategoria.findUnique as any).mockResolvedValue({ prefijoSku: 'LAP' });
      
      await expect(validarCoherenciaSku('LAP-001', 1)).resolves.not.toThrow();
    });
  });
});
