import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
const prisma = new PrismaClient();

// ==========================================
// HISTORIAL DE ÓRDENES
// ==========================================
export const getMisOrdenes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) throw new AppError('No autenticado', 401);

    let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
    if (!cliente) throw new AppError('Perfil de cliente no encontrado', 404);

    const ordenes = await prisma.ordOrden.findMany({
      where: { clienteId: cliente.id },
      include: { 
        estado: { select: { nombre: true } },
        items: true 
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    res.json({ success: true, data: ordenes });
  } catch (error) { next(error); }
};

// ==========================================
// LISTA DE DESEOS
// ==========================================
// Obtener deseos
export const getMisDeseos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.json({ success: true, data: [] }); // Si no hay sesión, devolver vacío sin error

    let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
    if (!cliente) return res.json({ success: true, data: [] });

    const lista = await prisma.cliListaDeseos.findFirst({ where: { clienteId: cliente.id } });
    if (!lista) return res.json({ success: true, data: [] });

    const items = await prisma.cliItemListaDeseo.findMany({ 
      where: { listaDeseoId: lista.id },
      include: { 
        producto: { 
          select: { 
            id: true, 
            nombre: true, 
            sku: true, 
            precioVenta: true, 
            estado: true 
          } 
        } 
      },
      orderBy: { fechaAgregado: 'desc' }
    });

    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};


// Toggle (Agregar/Quitar) usando UPSERT (La solución definitiva contra el 500)
export const toggleDeseo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) throw new AppError('No autenticado', 401);
      const productoId = req.body.productoId;
      if (!productoId) throw new AppError('Producto no especificado', 400);
  
      let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
      if (!cliente) {
        cliente = await prisma.cliCliente.create({ data: { usuarioId, razonSocial: 'Cliente' } });
      }
  
      let lista = await prisma.cliListaDeseos.findFirst({ where: { clienteId: cliente.id } });
      if (!lista) {
        lista = await prisma.cliListaDeseos.create({ data: { clienteId: cliente.id } });
      }
  
      // SOLUCIÓN SEGUURA: Buscar si existe.
      const yaExiste = await prisma.cliItemListaDeseo.findFirst({
        where: { listaDeseoId: lista.id, productoId }
      });
  
      if (yaExiste) {
        // Si existe, lo borramos usando la clave compuesta
        await prisma.cliItemListaDeseo.delete({
          where: { 
            listaDeseoId_productoId: {
              listaDeseoId: lista.id,
              productoId: productoId
            }
          }
        });
        return res.json({ success: true, message: 'Eliminado de deseos', activo: false });
      } else {
        // Si no existe, lo creamos
        await prisma.cliItemListaDeseo.create({
          data: { listaDeseoId: lista.id, productoId }
        });
        return res.json({ success: true, message: 'Agregado a deseos', activo: true });
      }
  
    } catch (error) { 
      // Si falla por cualquier otra razón (ej. FK restrict), lo captura el errorHandler
      next(error); 
    }
  };

// ==========================================
// DIRECCIONES
// ==========================================
export const getMisDirecciones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuario?.id;
    let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
    if (!cliente) return res.json({ success: true, data: [] });

    const direcciones = await prisma.cliDireccion.findMany({ where: { clienteId: cliente.id }, orderBy: { esPrincipal: 'desc' } });
    res.json({ success: true, data: direcciones });
  } catch (error) { next(error); }
};

export const crearDireccion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) throw new AppError('No autenticado', 401);
    
    let cliente = await prisma.cliCliente.findUnique({ where: { usuarioId } });
    if (!cliente) cliente = await prisma.cliCliente.create({ data: { usuarioId, razonSocial: 'Cliente' } });

    const { alias, direccion, ciudad } = req.body;
    await prisma.cliDireccion.create({ data: { clienteId: cliente.id, alias, direccion, ciudad } });
    res.json({ success: true, message: 'Dirección guardada' });
  } catch (error) { next(error); }
};