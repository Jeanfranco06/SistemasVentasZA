// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { environment } from '../config/env';

interface JwtPayload {
  id: number;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export const proteger = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('No ha iniciado sesión. Acceso denegado.', 401));

  try {
    const decoded = jwt.verify(token, environment.JWT_SECRET) as JwtPayload;
    req.usuario = decoded;
    next();
  } catch (error) {
    next(new AppError('Token inválido o expirado.', 401));
  }
};

// Tupla (módulo, acción)
export const requerirRol = (modulo: string, accion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) return next(new AppError('Usuario no autenticado', 401));
    
    // En un caso real, se haría JOIN con permisos. Aquí validamos por rol directo para abreviar
    const esAdmin = req.usuario.roles.includes('Administrador');
    const permisoEspecifico = req.usuario.roles.some(r => {
      // Mapeo básico de permisos por rol para endpoints administrativos.
      if (r === 'Gerente Inventario') {
        if (modulo === 'inventario' && ['leer', 'crear', 'editar', 'eliminar'].includes(accion)) return true;
        if (modulo === 'productos' && ['leer', 'crear', 'editar'].includes(accion)) return true;
        if (modulo === 'proveedores' && ['leer', 'crear', 'editar', 'eliminar'].includes(accion)) return true;
        if (modulo === 'reportes' && ['leer'].includes(accion)) return true;
      }
      if (r === 'Gerente Ventas') {
        if (modulo === 'ordenes' && ['leer', 'editar'].includes(accion)) return true;
        if (modulo === 'estadisticas' && ['leer'].includes(accion)) return true;
        if (modulo === 'clientes' && ['leer', 'editar'].includes(accion)) return true;
        if (modulo === 'reportes' && ['leer'].includes(accion)) return true;
      }
      return false;
    });

    if (!esAdmin && !permisoEspecifico) {
       return next(new AppError('Sin permisos para realizar esta acción en este módulo.', 403));
    }
    next();
  };
};