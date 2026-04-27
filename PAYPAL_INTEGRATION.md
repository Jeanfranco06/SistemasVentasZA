# 🔐 Integración PayPal - Guía de Implementación

## 📋 Resumen

Se ha integrado **PayPal Checkout** como pasarela de pagos en el sistema. Los usuarios ahora pueden completar sus órdenes usando su cuenta de PayPal de forma segura.

---

## 🛠️ Componentes Agregados

### Backend

1. **`/backend/src/config/paypal.ts`**
   - Configuración del cliente PayPal
   - Gestiona ambiente Sandbox/Live

2. **`/backend/src/services/paypal.service.ts`**
   - Lógica de negocio para PayPal
   - `crearOrdenPayPal()` - Crear orden en PayPal
   - `capturarOrdenPayPal()` - Capturar pago
   - `obtenerDetallesOrdenPayPal()` - Obtener estado de pago

3. **`/backend/src/controllers/paypal.controller.ts`**
   - `crearOrdenPayPalController` - POST /pagos/paypal/crear-orden
   - `capturarPagoPayPal` - POST /pagos/paypal/capturar
   - `verificarEstadoPago` - GET /pagos/paypal/verificar

4. **Nuevas Rutas:**
   - `POST /api/v1/pagos/paypal/crear-orden` - Iniciar pago
   - `POST /api/v1/pagos/paypal/capturar` - Confirmar pago
   - `GET /api/v1/pagos/paypal/verificar` - Verificar estado

### Frontend

1. **`/frontend/src/components/checkout/PayPalCheckout.tsx`**
   - Componente React para renderizar botón de PayPal
   - Maneja flujo de creación → aprobación → captura
   - Notificaciones con react-hot-toast

---

## ⚙️ Variables de Entorno Requeridas

### Backend (`.env`)
```env
PAYPAL_MODE=sandbox                    # sandbox o live
PAYPAL_CLIENT_ID=xxxxx                 # ID de tu app PayPal
PAYPAL_CLIENT_SECRET=xxxxx             # Secret de tu app PayPal
FRONTEND_URL=http://localhost:5173     # URL del frontend
```

### Frontend (`.env.local`)
```env
VITE_PAYPAL_CLIENT_ID=xxxxx            # Same Client ID
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 📝 Pasos para Implementar

### 1️⃣ Obtener Credenciales de PayPal

1. Ve a [developer.paypal.com](https://developer.paypal.com)
2. Inicia sesión con tu cuenta PayPal
3. Ve a "Apps & Credentials"
4. Selecciona el ambiente **Sandbox**
5. Copia tu **Client ID** y **Client Secret**
6. Anota estos valores

### 2️⃣ Configurar Backend

```bash
cd backend
npm install @paypal/checkout-server-sdk
```

Actualiza tu `.env`:
```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=<tu-client-id>
PAYPAL_CLIENT_SECRET=<tu-client-secret>
FRONTEND_URL=http://localhost:5173
```

### 3️⃣ Configurar Frontend

Actualiza tu `.env.local`:
```env
VITE_PAYPAL_CLIENT_ID=<tu-client-id>
VITE_API_URL=http://localhost:4000/api/v1
```

### 4️⃣ Implementar en Checkout

En tu página de checkout, importa el componente:

```tsx
import { PayPalCheckout } from '@/components/checkout/PayPalCheckout';

export const CheckoutPage = () => {
  const [ordenId, setOrdenId] = useState<number | null>(null);
  
  return (
    <>
      {/* Resumen de orden */}
      {ordenId && (
        <PayPalCheckout
          ordenId={ordenId}
          monto={totalOrden}
          onSuccess={(transactionId) => {
            console.log('Pago exitoso:', transactionId);
            // Redirigir a confirmación
          }}
          onError={() => {
            console.log('Pago fallido');
          }}
        />
      )}
    </>
  );
};
```

### 5️⃣ Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 🔄 Flujo de Pago

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario completa carrito y va a checkout            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Se crea Orden interna en BD (estado: pendiente)      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Frontend renderiza botón PayPal                      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Usuario hace clic en "Pay with PayPal"              │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Backend llama POST /orders (PayPal API)             │
│    Retorna PayPal Order ID y URL de aprobación         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Usuario aprueba pago en PayPal                       │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Backend llama POST /orders/{id}/capture             │
│    PayPal captura los fondos                           │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Backend registra transacción en OrdTransaccionPago  │
│    Actualiza estado de Orden a "pagado"               │
│    Descuenta stock de inventario                       │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Frontend muestra confirmación                        │
│    Usuario recibe email de confirmación                │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] SDK de PayPal instalado en backend (`@paypal/checkout-server-sdk`)
- [ ] Variables de entorno configuradas (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
- [ ] Archivos de configuración creados (`config/paypal.ts`)
- [ ] Servicio PayPal implementado (`services/paypal.service.ts`)
- [ ] Controlador PayPal implementado (`controllers/paypal.controller.ts`)
- [ ] Rutas agregadas a `app.ts`
- [ ] Componente PayPal Checkout creado en frontend
- [ ] Variable de entorno VITE_PAYPAL_CLIENT_ID configurada
- [ ] Npm install ejecutado en ambos lados
- [ ] Servidor backend iniciado: `npm run dev` desde `/backend`
- [ ] Servidor frontend iniciado: `npm run dev` desde `/frontend`
- [ ] Probado flujo completo en ambiente Sandbox

---

## 🧪 Pruebas en Sandbox

PayPal proporciona cuentas de prueba para la verificación:

### Cuentas de Prueba (Sandbox)
- **Comprador:** sb-{random}@personal.example.com
- **Contraseña:** 123456789

Puedes encontrar todas las cuentas en:
Dashboard PayPal Developer → Accounts (en Sandbox)

### Tarjetas de Prueba
- **Visa:** 4111 1111 1111 1111
- **Expiración:** 12/25
- **CVV:** 123

---

## 📊 Base de Datos

El sistema ya tiene soporte para pagos:

```sql
-- Tabla de Pagos
CREATE TABLE ord_pagos (
  id SERIAL PRIMARY KEY,
  orden_id INT UNIQUE NOT NULL,
  metodo VARCHAR(50),           -- 'paypal', 'tarjeta', etc.
  estado VARCHAR(20),           -- 'pendiente', 'completado', 'fallido'
  FOREIGN KEY (orden_id) REFERENCES ord_ordenes(id)
);

-- Tabla de Transacciones
CREATE TABLE ord_transacciones_pago (
  id SERIAL PRIMARY KEY,
  pago_id INT NOT NULL,
  estado VARCHAR(20),           -- 'completado', 'fallido', 'reembolsado'
  monto DECIMAL(12,2),
  respuesta_json JSONB,         -- Respuesta completa de PayPal
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (pago_id) REFERENCES ord_pagos(id)
);
```

---

## 🚀 Próximos Pasos (Opcionales)

1. **Webhook de PayPal** - Validar pagos en tiempo real
2. **Soporte para múltiples métodos** - Tarjeta, transferencia, etc.
3. **Reembolsos** - Implementar devolución de pagos
4. **Analytics** - Dashboard de conversiones de pago
5. **Email** - Enviar confirmación de pago

---

## 🐛 Troubleshooting

### Error: "Client ID not found"
✓ Verifica que PAYPAL_CLIENT_ID esté en el `.env`

### Error: "Order creation failed"
✓ Verifica que PAYPAL_CLIENT_SECRET es correcto
✓ Asegúrate de usar el modo `sandbox` para pruebas

### Botón de PayPal no aparece
✓ Revisa VITE_PAYPAL_CLIENT_ID en frontend `.env.local`
✓ Verifica que el contenedor `#paypal-button-container` exista

### Pago pendiente/no completa
✓ Revisa logs del backend para errores
✓ Verifica que FRONTEND_URL sea accesible

---

## 📞 Soporte

Para más información:
- [PayPal Developer Docs](https://developer.paypal.com/docs)
- [SDK JavaScript de Checkout](https://developer.paypal.com/sdk/js/reference/)
- [Node.js SDK](https://github.com/paypal/Checkout-NodeJS-SDK)
