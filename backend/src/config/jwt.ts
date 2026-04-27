// backend/src/config/jwt.ts
import jwt from 'jsonwebtoken';
import { environment } from './env.js';

export const generarTokens = (usuarioId: number, roles: string[]) => {
  const payload = { id: usuarioId, roles };
  const accessToken = jwt.sign(payload, environment.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, environment.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};