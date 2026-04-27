# Despliegue en Producción

**Repositorio:** https://github.com/Jeanfranco06/SistemasVentasZA.git

## Base de Datos
1. Crea una base de datos PostgreSQL en Neon.tech (gratuito)
2. Copia la URL de conexión

## Backend (Railway)
1. Ve a https://railway.app y crea una cuenta
2. Conecta tu repositorio GitHub
3. Crea un nuevo proyecto desde el repositorio
4. En las variables de entorno, agrega:
   - `DATABASE_URL`: URL de Neon
   - `NODE_ENV`: production
   - `JWT_SECRET`: clave secreta para JWT
   - `JWT_REFRESH_SECRET`: clave secreta para refresh
   - `PORT`: 4000 (o automático)
5. Railway detectará automáticamente el build y start
6. Una vez desplegado, ejecuta las migraciones:
   - En la consola de Railway: `npx prisma migrate deploy`
7. Ejecuta el seed si es necesario: `npx prisma db seed`

## Frontend (Vercel)
1. Ve a https://vercel.com y crea una cuenta
2. Instala Vercel CLI: `npm i -g vercel`
3. En la carpeta frontend: `vercel`
4. Sigue los pasos para conectar el repositorio
5. En las variables de entorno de Vercel, agrega:
   - `VITE_API_URL`: URL del backend desplegado (ej: https://tu-backend.railway.app/api/v1)
6. Despliega

## URLs de Producción
- Frontend: https://tu-proyecto.vercel.app
- Backend: https://tu-backend.railway.app
- API Docs: https://tu-backend.railway.app/api-docs