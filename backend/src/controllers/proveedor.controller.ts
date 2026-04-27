import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const actualizarProveedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.invProveedor.update({
      where: { id: Number(id) },
      data: req.body,
    });
    res.json({ success: true, message: 'Proveedor actualizado' });
  } catch (error) {
    next(error);
  }
};

// backend/src/controllers/proveedor.controller.ts

export const eliminarProveedor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proveedorId = Number(req.params.id);
  
      // Eliminación Física directa
      await prisma.invProveedor.delete({
        where: { id: proveedorId }
      });
  
      res.json({ success: true, message: 'Proveedor eliminado permanentemente' });
    } catch (error) { 
      // Si tiene órdenes de compra asociadas, PostgreSQL lanzará RESTRICT.
      // El globalErrorHandler interceptará el error P2003 y devolverá:
      // "No se puede eliminar: Tiene registros asociados en inv_ordenes_compra."
      next(error); 
    }
  };