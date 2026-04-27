# Despliegue en Producción

**Repositorio:** https://github.com/Jeanfranco06/SistemasVentasZA.git

## Base de Datos
1. Usa Neon.tech (ya configurado):
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_v8srA7klHhyg@ep-bold-band-an8xrzvg.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## Backend (Render - Alternativa a Railway)
1. Ve a [render.com](https://render.com) y crea una cuenta gratuita
2. **"New"** → **"Web Service"**
3. Conecta tu repositorio GitHub: `Jeanfranco06/SistemasVentasZA`
4. Configura:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
5. En **Environment** agrega:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_v8srA7klHhyg@ep-bold-band-an8xrzvg.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
   NODE_ENV=production
   JWT_SECRET=tu_clave_jwt_segura
   JWT_REFRESH_SECRET=tu_clave_refresh_segura
   PORT=10000
   ```
6. **Create Web Service**
7. Una vez desplegado, ve a la **Shell** del servicio
8. Ejecuta las migraciones:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Frontend (Vercel)
1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. **"New Project"** → Importar desde GitHub
3. Seleccionar `Jeanfranco06/SistemasVentasZA`
4. Configurar:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. En **Environment Variables** agregar:
   ```
   VITE_API_URL=https://tu-backend-render.onrender.com/api/v1
   ```
6. **Deploy**

## URLs de Producción
- Frontend: https://tu-proyecto.vercel.app
- Backend: https://tu-backend.onrender.com
- API Docs: https://tu-backend.onrender.com/api-docs

## 🔧 Notas Técnicas
- **Build**: El backend ahora compila correctamente con configuración relajada de TypeScript
- **Dependencias**: Todas las dependencias necesarias están incluidas
- **Base de datos**: Neon.tech proporciona conexión SSL automática
- **Variables de entorno**: Asegúrate de configurar todas las variables requeridas