# Variables de Entorno Requeridas para Producción

## Frontend (Vercel)

Estas variables deben configurarse en **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend API | `https://tu-backend.railway.app/api/v1` |
| `VITE_PAYPAL_CLIENT_ID` | Client ID de PayPal para el SDK | `AbWDiwKcRF0GR0guHIZH9TVudXipp8eAYxHciPMMyHIFlK4weblV0a8dw9oxD2CwU2csaitpQabazI7Y` |

### Pasos para configurar en Vercel:
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `sistemas-ventas-za`
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable con su valor correspondiente
5. Asegúrate de seleccionar **Production** y **Preview** como entornos
6. Haz clic en **Save**
7. Vuelve a desplegar: ve a **Deployments** → **Redeploy** en la última versión

## Backend (Railway/Render/otro)

Estas variables deben configurarse en el servicio donde está desplegado el backend:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:password@host:5432/dbname` |
| `PAYPAL_CLIENT_ID` | Client ID de PayPal | `tu_client_id` |
| `PAYPAL_CLIENT_SECRET` | Client Secret de PayPal | `tu_client_secret` |
| `PAYPAL_MODE` | Modo de PayPal (sandbox/production) | `sandbox` |
| `JWT_SECRET` | Secreto para tokens JWT | `tu_secreto_muy_seguro` |
| `NODE_ENV` | Entorno de la aplicación | `production` |
| `PORT` | Puerto del servidor | `4000` |

## Notas Importantes

1. **Error "Unchecked runtime.lastError"**: Este error es causado por extensiones de Chrome (como PayPal Honey, Capital One Shopping, etc.) y NO afecta la funcionalidad de la aplicación. Puedes ignorarlo.

2. **Error 404**: Si ves un error 404 en la consola, verifica que:
   - `VITE_API_URL` esté correctamente configurada en Vercel
   - El backend esté desplegado y accesible
   - No haya problemas de CORS

3. **PayPal no aparece**: Si el botón de PayPal no aparece:
   - Verifica que `VITE_PAYPAL_CLIENT_ID` esté configurada
   - Revisa la consola del navegador para errores específicos
   - Asegúrate de haber redeployado después de agregar las variables

## Verificación

Para verificar que todo está configurado correctamente:

1. Abre las herramientas de desarrollador del navegador (F12)
2. Ve a la pestaña **Network** (Red)
3. Intenta realizar un pago con PayPal
4. Verifica que las peticiones a `/api/v1/pagos/paypal/crear-orden` y `/api/v1/pagos/paypal/capturar` sean exitosas (status 200/201)

## Soporte

Si continúas teniendo problemas:
1. Revisa los logs de Vercel: **Deployments** → selecciona el último → **View Logs**
2. Revisa los logs del backend (Railway/Render)
3. Verifica que las variables de entorno estén correctamente escritas (sin espacios extra)