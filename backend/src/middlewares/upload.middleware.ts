// backend/src/middlewares/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError.js';

// Usar ruta absoluta basada en process.cwd() que apunta al directorio del backend
const uploadsDir = path.join(process.cwd(), 'uploads', 'productos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + nombre original + extensión
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)', 400));
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por archivo
    files: 10 // Máximo 10 archivos por solicitud
  }
});

// Función para obtener URL de imagen
export const getImageUrl = (filename: string): string => {
  return `/uploads/productos/${filename}`;
};
