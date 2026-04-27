// backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { generarTokens } from '../config/jwt';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email y contraseña son requeridos', 400);

    const usuario = await prisma.segUsuario.findUnique({
      where: { email },
      include: { segUsuarioRol: { include: { rol: true } } }
    });

    if (!usuario || !usuario.activo) throw new AppError('Credenciales inválidas', 401);

    const passwordCorrecta = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordCorrecta) throw new AppError('Credenciales inválidas', 401);

    const roles = usuario.segUsuarioRol.map(ur => ur.rol.nombre);
    const tokens = generarTokens(usuario.id, roles);

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombreCompleto, roles } },
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    next(error);
  }
};

export const registroCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, nombreCompleto, tipoDocumento, numeroDocumento } = req.body;

    const usuarioExistente = await prisma.segUsuario.findUnique({ where: { email } });
    if (usuarioExistente) throw new AppError('El email ya está registrado', 400);

    const passwordHash = await bcrypt.hash(password, 12);

    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      const user = await tx.segUsuario.create({
        data: { email, passwordHash, nombreCompleto },
      });
      
      const rolCliente = await tx.segRol.findFirst({ where: { nombre: 'Cliente' } });
      if (rolCliente) {
        await tx.segUsuarioRol.create({
          data: { usuarioId: user.id, rolId: rolCliente.id }
        });
      }

      await tx.cliCliente.create({
        data: {
          usuarioId: user.id,
          tipoDocumento,
          numeroDocumento,
          razonSocial: nombreCompleto,
        }
      });

      return user;
    });

    const roles = ['Cliente'];
    const tokens = generarTokens(nuevoUsuario.id, roles);

    res.status(201).json({
      success: true,
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Cliente registrado exitosamente'
    });
  } catch (error) { next(error); }
};