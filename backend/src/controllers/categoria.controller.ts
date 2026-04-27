// backend/src/controllers/categoria.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
const prisma = new PrismaClient();

export const listarCategoriasAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.catCategoria.findMany({ orderBy: { nombre: 'asc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const crearCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, prefijoSku } = req.body;
    if (!/^[A-Z]{3}$/.test(prefijoSku)) throw new AppError('El prefijo debe ser exactamente 3 letras mayúsculas', 400);
    const nueva = await prisma.catCategoria.create({ data: { nombre, prefijoSku } });
    res.status(201).json({ success: true, data: nueva });
  } catch (error) { next(error); }
};

export const actualizarCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nombre, prefijoSku } = req.body;
    if (!/^[A-Z]{3}$/.test(prefijoSku)) throw new AppError('El prefijo debe ser exactamente 3 letras mayúsculas', 400);
    
    await prisma.catCategoria.update({ where: { id: Number(id) }, data: { nombre, prefijoSku } });
    res.json({ success: true, message: 'Categoría actualizada' });
  } catch (error) { next(error); }
};

// backend/src/controllers/categoria.controller.ts

export const eliminarCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoriaId = Number(req.params.id);

    // VALIDACIÓN COMERCIAL: Verificar si tiene productos ACTIVOS asociados
    const productosActivos = await prisma.catProducto.count({
      where: { categoriaId, activo: true }
    });

    if (productosActivos > 0) {
      // Lanzamos el mismo error 400 que se lanzaba antes por RESTRICT
      throw new AppError(`No se puede desactivar: Tiene ${productosActivos} productos activos asociados.`, 400);
    }

    // ELIMINACIÓN LÓGICA
    await prisma.catCategoria.update({
      where: { id: categoriaId },
      data: { activo: false }
    });

    res.json({ success: true, message: 'Categoría desactivada correctamente' });
  } catch (error) { next(error); }
};

// Ruta pública para que la tienda pueda llenar el filtro sin autenticación
export const listarCategoriasPublicas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.catCategoria.findMany({ 
      where: { activo: true },
      orderBy: { nombre: 'asc' } 
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};