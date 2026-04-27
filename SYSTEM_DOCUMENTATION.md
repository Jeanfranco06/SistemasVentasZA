# StockFlow - Sistema Integral de Gestión de Ventas y Inventario

**Versión:** 1.0.0  
**Fecha de actualización:** Abril 2026  
**Autor:** Desarrollo  

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Tecnologías](#tecnologías)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Módulos Principales](#módulos-principales)
5. [Roles y Permisos](#roles-y-permisos)
6. [Flujo de Negocio](#flujo-de-negocio)
7. [Gestión de Datos](#gestión-de-datos)
8. [Seguridad](#seguridad)
9. [Integración de Pagos](#integración-de-pagos)
10. [APIs y Endpoints](#apis-y-endpoints)
11. [Manejo de Errores](#manejo-de-errores)

---

## 🎯 Visión General

**StockFlow** es una plataforma empresarial de gestión de ventas e inventario diseñada para pequeñas y medianas empresas de tecnología. El sistema proporciona una solución integral que conecta clientes con un catálogo de productos, gestión de órdenes, procesamiento de pagos y administración completa del inventario.

### Objetivos Principales

- **Automatización de ventas**: Proporcionar una tienda virtual segura y fácil de usar
- **Gestión de inventario**: Mantener control en tiempo real del stock disponible
- **Flujo de órdenes**: Procesar compras de forma ágil y confiable
- **Reportes analíticos**: Proporcionar insights sobre ventas, rotación de inventario y comportamiento de clientes
- **Integración de pagos**: Soporte para múltiples métodos de pago con seguridad garantizada
- **Control administrativo**: Panel completo para administradores, gerentes de ventas y gestores de inventario

### Casos de Uso Principales

1. **Cliente**: Navega catálogo, agrega productos al carrito, realiza compras con pago seguro
2. **Gerente de Ventas**: Monitorea órdenes, clientes, comportamiento de compra y tendencias
3. **Gerente de Inventario**: Administra stock, proveedores, movimientos de mercadería
4. **Administrador**: Control total del sistema, usuarios, configuración y reportes

---

## 💻 Tecnologías

### Stack Backend

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **Node.js** | LTS | Runtime de JavaScript del servidor |
| **Express** | 4.19.2 | Framework web y API REST |
| **TypeScript** | 5.4.5 | Tipado estático para JavaScript |
| **Prisma** | 5.12.1 | ORM para gestión de base de datos |
| **PostgreSQL** | 13+ | Base de datos relacional principal |
| **JWT (jsonwebtoken)** | 9.0.2 | Autenticación y autorización |
| **Bcrypt** | 5.1.1 | Encriptación de contraseñas |
| **PayPal SDK** | 2.3.0 | Integración de pagos PayPal |
| **PDFKit** | 0.18.0 | Generación de reportes en PDF |
| **Helmet** | 7.1.0 | Seguridad HTTP |
| **CORS** | 2.8.5 | Control de recursos entre orígenes |
| **Rate Limiting** | 7.2.0 | Control de límite de solicitudes |
| **Zod** | 3.22.4 | Validación de esquemas |

### Stack Frontend

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **React** | 18+ | Librería de interfaz de usuario |
| **TypeScript** | 5.1+ | Tipado estático |
| **Vite** | 5.4.21 | Bundler y servidor de desarrollo |
| **React Router** | 6+ | Enrutamiento de aplicación |
| **Zustand** | Latest | Gestión de estado |
| **TanStack Query** | Latest | Caché de datos y sincronización |
| **Tailwind CSS** | 3.4+ | Estilos CSS utility-first |
| **React Hot Toast** | Latest | Notificaciones de usuario |
| **PayPal JS SDK** | Latest | Botón de pago PayPal |
| **Lucide Icons** | Latest | Iconografía |

### Base de Datos

```
PostgreSQL 13+
├── seg_* (Seguridad - Usuarios, Roles, Permisos, Auditoría)
├── cat_* (Catálogo - Productos, Categorías, Imágenes)
├── cli_* (Clientes - Información, Deseos, Direcciones)
├── inv_* (Inventario - Stock, Proveedores, Movimientos)
└── ord_* (Órdenes - Compras, Pagos, Historial)
```

---

## 🏗️ Arquitectura del Sistema

### Topología General

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                      │
│              Frontend React + TypeScript + Vite             │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTPS / REST API
                             │
┌────────────────────────────▼────────────────────────────────┐
│               BACKEND (Node.js + Express)                   │
│  ├── Autenticación & Autorización (JWT + Roles)            │
│  ├── Rutas API (/api/v1/*)                                 │
│  ├── Controladores de Negocio                              │
│  ├── Servicios (PayPal, Órdenes, Inventario, etc)         │
│  └── Middleware (Errores, Auth, Rate Limiting)             │
└────────────────────────────┬────────────────────────────────┘
                             │
                          ORM (Prisma)
                             │
┌────────────────────────────▼────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL)                     │
│  ├── Esquema: seg_*, cat_*, cli_*, inv_*, ord_*           │
│  ├── Transacciones ACID completas                          │
│  └── Locks para operaciones concurrentes críticas          │
└─────────────────────────────────────────────────────────────┘
                             │
                    Servicios externos
                             │
        ┌────────────────────┴──────────────────┐
        │                                       │
        ▼                                       ▼
    ┌────────────────┐              ┌──────────────────┐
    │  PayPal API    │              │  Sistema Archivos│
    │ (Pagos online) │              │  (Uploads/PDF)   │
    └────────────────┘              └──────────────────┘
```

### Flujo de Capas

**Request Flow:**
```
Cliente → Middleware (Auth, Validation) → Controlador → Servicio → Prisma → BD
                                                  ↓
                                        Respuesta JSON
```

---

## 📦 Módulos Principales

### 1. 🔐 Módulo de Seguridad (`seg_*`)

**Responsabilidad:** Gestionar autenticación, autorización y auditoría

**Tablas:**
- `seg_usuarios`: Registro de usuarios del sistema
- `seg_roles`: Roles disponibles (Administrador, Gerente Ventas, Gerente Inventario, Cliente)
- `seg_permisos`: Permisos granulares (módulo + acción)
- `seg_usuario_rol`: Asignación de roles a usuarios
- `seg_rol_permiso`: Asignación de permisos a roles
- `seg_auditoria`: Log de acciones realizadas en el sistema

**Características:**
- Autenticación con JWT (JSON Web Tokens)
- Contraseñas encriptadas con Bcrypt
- RBAC (Control de Acceso Basado en Roles)
- Auditoría completa de cambios

**Endpoints:**
```
POST   /auth/login              → Iniciar sesión
POST   /auth/registro-cliente   → Registro de nuevo cliente
```

---

### 2. 📦 Módulo de Catálogo (`cat_*`)

**Responsabilidad:** Gestionar productos, categorías e imágenes

**Tablas:**
- `cat_categorias`: Clasificación de productos
- `cat_productos`: Información de productos
- `cat_imagenes_productos`: Galería de imágenes por producto

**Características:**
- Productos con múltiples imágenes
- Categorías jerárquicas
- Precios con descuentos/ofertas
- Códigos SKU únicos
- Estados de producto (activo, descontinuado, borrador)
- Información de proveedores

**Endpoints:**
```
GET    /productos/tienda          → Listar productos públicos (con filtros)
GET    /productos/:id             → Detalle de producto
GET    /productos/stock           → Verificar stock disponible
POST   /admin/productos           → Crear producto (Admin)
PUT    /admin/productos/:id       → Actualizar producto (Admin)
DELETE /admin/productos/:id       → Eliminar producto (Admin)
POST   /admin/productos/imagenes  → Subir imágenes
```

---

### 3. 👥 Módulo de Clientes (`cli_*`)

**Responsabilidad:** Gestionar información y preferencias de clientes

**Tablas:**
- `cli_clientes`: Perfil de cliente
- `cli_lista_deseos`: Productos favoritos guardados
- `cli_direcciones`: Múltiples direcciones de envío

**Características:**
- Perfil de cliente vinculado a usuario
- Lista de deseos para comparar productos
- Múltiples direcciones de envío
- Historial de preferencias

**Endpoints:**
```
GET    /clientes/deseos              → Obtener lista de deseos
POST   /clientes/deseos              → Agregar a deseos
DELETE /clientes/deseos/:id          → Quitar de deseos
GET    /clientes/direcciones         → Listar direcciones
POST   /clientes/direcciones         → Crear dirección
GET    /clientes/ordenes             → Historial de órdenes
GET    /clientes/ordenes/:id         → Detalle de orden
GET    /clientes/ordenes/:id/pdf     → Descargar comprobante
```

---

### 4. 🛒 Módulo de Órdenes (`ord_*`)

**Responsabilidad:** Gestionar el ciclo completo de compras

**Tablas:**
- `ord_ordenes`: Información principal de la compra
- `ord_items_ordenes`: Productos incluidos en la orden
- `ord_direcciones_envio`: Detalles de envío
- `ord_metodo_envio`: Opciones de transporte
- `ord_pagos`: Información de pago realizado
- `ord_transacciones_pago`: Registro transaccional
- `ord_estado_orden`: Catálogo de estados posibles
- `ord_historial_estado`: Seguimiento de cambios de estado
- `ord_carrito`: Carrito temporal de compra

**Estados posibles:**
- `pendiente_confirmacion` → Creada, esperando confirmación
- `pendiente_pago` → Confirmada, aguardando pago
- `pagada` → Pago recibido
- `en_proceso` → Preparando envío
- `enviada` → En tránsito
- `entregada` → Completada
- `cancelada` → Anulada por cliente o sistema
- `devuelta` → Producto devuelto

**Características:**
- Stock reservado al crear orden
- Cálculo automático de IGV (18%)
- Multiplos métodos de pago
- Historial de cambios de estado
- Generación de PDF de comprobantes
- Transacciones ACID para consistencia de datos

**Endpoints:**
```
POST   /ordenes/carrito           → Agregar al carrito
GET    /ordenes/carrito           → Obtener carrito
POST   /ordenes/checkout          → Realizar compra
GET    /ordenes/mis-ordenes       → Historial de cliente
GET    /ordenes/:id               → Detalle de orden
PUT    /ordenes/:id/estado        → Cambiar estado (Admin/Gerente)
```

---

### 5. 💰 Módulo de Pagos (`PayPal`)

**Responsabilidad:** Procesar pagos de forma segura

**Integración:** PayPal Checkout SDK v2

**Flujo de Pago:**
```
1. Cliente crea orden en BD (estado: pendiente_pago, stock reservado)
2. Frontend llama PayPal SDK
3. Cliente autoriza pago en PayPal
4. Backend captura pago con PayPal API
5. Sistema confirma pago y desglosa stock
6. BD actualiza estado a "pagada"
7. Historial registra transacción
```

**Características:**
- Autorización y captura de dos pasos
- Manejo seguro de tokens OAuth
- Conversión de moneda a USD
- Webhooks para notificaciones
- Validación de monto exacto
- Logs detallados de transacciones

**Endpoints:**
```
POST   /pagos/paypal/crear-orden      → Crear orden PayPal
POST   /pagos/paypal/capturar         → Capturar pago
GET    /pagos/paypal/estado           → Verificar estado
GET    /pagos/paypal/probar           → Test de conexión
```

---

### 6. 📊 Módulo de Inventario (`inv_*`)

**Responsabilidad:** Gestionar stock, proveedores y movimientos

**Tablas:**
- `inv_stock_producto`: Cantidad física y reservada por producto
- `inv_proveedores`: Información de proveedores
- `inv_movimientos_inventario`: Auditoría de cambios de stock
- `inv_ordenes_compra`: Compras a proveedores
- `inv_recepcion_mercaderia`: Ingreso de mercadería

**Características:**
- Stock físico vs stock disponible
- Reservas automáticas en órdenes
- Movimientos auditados
- Órdenes de compra a proveedores
- Seguimiento de recepciones
- Cálculo de rotación y valor de inventario

**Estados de Producto:**
- `borrador` → No visible públicamente
- `activo` → Disponible para venta
- `descontinuado` → No se vende, pero existe en órdenes históricas

**Endpoints:**
```
GET    /inventario/dashboard         → Resumen de inventario
GET    /inventario/productos         → Listar con stock detallado
POST   /inventario/ajustar-stock     → Ajuste manual
GET    /inventario/historial         → Movimientos de stock
POST   /inventario/ordenes-compra    → Crear OC a proveedor
POST   /inventario/recibir           → Recibir mercadería
GET    /inventario/proveedores       → Listar proveedores
POST   /inventario/proveedores       → Crear proveedor
```

---

### 7. 📈 Módulo de Reportes (`Reportes`)

**Responsabilidad:** Analizar y generar informes de negocio

**Reportes Disponibles:**

| Reporte | Datos | Frecuencia |
|---------|-------|-----------|
| Órdenes por Período | Volumen, ingresos, estados | Diario |
| Inventario Valorizado | Costo, rotación, obsolescencia | Mensual |
| Stock Bajo | Productos bajo umbral | Real-time |
| Pagos Recibidos | Flujo de ingresos | Diario |
| Rentabilidad por Producto | Margen, rotación, contribución | Mensual |
| Comportamiento de Clientes | RFM: Recencia, Frecuencia, Monto | Mensual |
| Análisis ABC | Clasificación Pareto | Trimestral |
| Rotación de Inventario | Velocidad de venta | Mensual |

**Formatos:**
- JSON (API)
- PDF (Descargable)
- Excel (Exportable)

---

### 8. 📊 Módulo de Estadísticas

**Análisis Disponibles:**

1. **Análisis ABC** - Clasificación de productos por valor de venta
   - Clase A: 20% de productos = 80% del valor
   - Clase B: 30% de productos = 15% del valor
   - Clase C: 50% de productos = 5% del valor

2. **Análisis RFM** - Segmentación de clientes
   - Recencia (R): Cuándo fue última compra
   - Frecuencia (F): Cuántas veces ha comprado
   - Monto (M): Cuánto ha gastado

3. **Resumen de Estadísticas**
   - Total de órdenes
   - Ingresos totales
   - Clientes activos
   - Ticket promedio

---

### 9. 🚀 Módulo de Ventas

**Responsabilidad:** Dar visibilidad del negocio a gerentes de ventas

**Características:**
- Dashboard de ventas en tiempo real
- Seguimiento de órdenes
- Análisis de clientes
- Tendencias de compra
- Predicciones de demanda

**Endpoints:**
```
GET    /ventas/dashboard            → Resumen KPIs
GET    /ventas/ordenes              → Órdenes recientes
GET    /ventas/clientes/:id         → Perfil detallado de cliente
GET    /ventas/ordenes/:id/historial → Cambios de estado
```

---

## 👤 Roles y Permisos

### Estructura RBAC (Role-Based Access Control)

```
┌─────────────────────────────────────────┐
│         SEGURIDAD (Roles)               │
├─────────────────────────────────────────┤
│ SegRol                                  │
│  ├─ id                                  │
│  ├─ nombre (Único)                      │
│  └─ descripcion                         │
│                                         │
│ Relaciones:                             │
│  ├─ segRolPermiso[] (Muchos permisos)  │
│  └─ segUsuarioRol[] (Muchos usuarios)   │
└─────────────────────────────────────────┘
```

### Roles Definidos

#### 🔒 1. **Administrador**
- **Descripción:** Control total del sistema
- **Acceso:** Todas las funcionalidades
- **Responsabilidades:**
  - Crear y gestionar usuarios
  - Configurar roles y permisos
  - Gestionar catálogo de productos
  - Supervisar todas las operaciones
  - Acceso a auditoría completa

**Permisos:**
```
Módulos: usuarios, roles, productos, órdenes, inventario, 
         reportes, configuración, seguridad
```

#### 💼 2. **Gerente de Ventas**
- **Descripción:** Supervisión y análisis de ventas
- **Acceso:** Módulos de órdenes, clientes y reportes
- **Responsabilidades:**
  - Monitorear órdenes
  - Analizar comportamiento de clientes
  - Generar reportes de ventas
  - Cambiar estados de órdenes

**Permisos:**
```
Módulos: órdenes (lectura/actualización), clientes (lectura),
         reportes (lectura), estadísticas (lectura)
```

#### 📦 3. **Gerente de Inventario**
- **Descripción:** Gestión completa del inventario
- **Acceso:** Módulos de inventario y productos
- **Responsabilidades:**
  - Administrar stock
  - Gestionar proveedores
  - Crear órdenes de compra
  - Ajustar cantidades
  - Crear productos en borrador

**Permisos:**
```
Módulos: inventario (completo), productos (lectura/borrador),
         proveedores (completo), movimientos (lectura/creación)
```

#### 👤 4. **Cliente**
- **Descripción:** Usuario final comprador
- **Acceso:** Solo módulos públicos
- **Responsabilidades:**
  - Navegar catálogo
  - Gestionar carrito
  - Realizar compras
  - Descargar comprobantes
  - Ver historial de órdenes

**Permisos:**
```
Módulos: catálogo (lectura), carrito (completo), órdenes (propias),
         clientes/perfil (propia), deseos (propio)
```

### Matriz de Permisos

| Operación | Admin | Gerente Ventas | Gerente Inv. | Cliente |
|-----------|-------|---|---|---|
| Crear Producto | ✅ | ❌ | ⚠️ (borrador) | ❌ |
| Editar Producto | ✅ | ❌ | ⚠️ (stock) | ❌ |
| Ver Órdenes Todas | ✅ | ✅ | ⚠️ (compra) | ❌ |
| Ver Mis Órdenes | ✅ | ❌ | ❌ | ✅ |
| Cambiar Estado Orden | ✅ | ✅ | ❌ | ❌ |
| Crear Orden de Compra | ✅ | ❌ | ✅ | ❌ |
| Ver Reportes | ✅ | ✅ | ⚠️ (limitados) | ❌ |
| Gestionar Usuarios | ✅ | ❌ | ❌ | ❌ |
| Comprar | ⚠️ | ⚠️ | ⚠️ | ✅ |

---

## 🔄 Flujo de Negocio

### 1. Flujo de Compra Completo (Cliente)

```
┌─────────────────────────────────────────────────────────┐
│ 1. EXPLORACIÓN DE CATÁLOGO                              │
├─────────────────────────────────────────────────────────┤
│ • Cliente navega productos                              │
│ • Filtra por categoría, precio, búsqueda                │
│ • Ve detalles: precio, stock, descripción               │
│ • Puede agregar a lista de deseos                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 2. CARRITO DE COMPRAS                                   │
├─────────────────────────────────────────────────────────┤
│ • Selecciona cantidad (max = stock disponible)          │
│ • Agrega al carrito                                     │
│ • Puede ver resumen, cambiar cantidades                 │
│ • Recibe alertas si llega a stock máximo               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 3. CHECKOUT WIZARD (5 PASOS)                            │
├─────────────────────────────────────────────────────────┤
│ PASO 1: Identificación                                  │
│  • DNI/RUC opcional para factura                        │
│                                                         │
│ PASO 2: Dirección de Envío                              │
│  • Dirección completa                                   │
│  • Ciudad/departamento                                  │
│                                                         │
│ PASO 3: Método de Envío                                 │
│  • Estándar: 3-5 días hábiles (S/ 15.00)               │
│                                                         │
│ PASO 4: Método de Pago                                  │
│  • Tarjeta de crédito/débito (simulado)                │
│  • PayPal (integración real)                            │
│                                                         │
│ PASO 5: Revisión                                        │
│  • Resumen de productos                                 │
│  • Detalles de envío                                    │
│  • Cálculo final con IGV                                │
│  • Confirmación de compra                               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 4. PROCESAMIENTO DE PAGO                                │
├─────────────────────────────────────────────────────────┤
│ Backend:                                                │
│  • Crea orden con estado "pendiente_pago"               │
│  • Reserva stock en inventario                          │
│  • Genera código de orden único                         │
│                                                         │
│ Si Pago Exitoso:                                        │
│  • Captura pago de PayPal                               │
│  • Cambia estado a "pagada"                             │
│  • Desglosa stock del inventario                        │
│  • Genera comprobante PDF                               │
│  • Envía confirmación por email                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 5. SEGUIMIENTO POST-COMPRA                              │
├─────────────────────────────────────────────────────────┤
│ • Cliente puede ver historial de órdenes                │
│ • Seguimiento de estado en tiempo real                  │
│ • Descarga de comprobantes                              │
│ • Valida recepción del producto                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Flujo de Stock y Reservas

```
ESTADO INICIAL:
┌──────────────────────┐
│ Stock Físico: 100    │
│ Stock Reservado: 0   │
│ Stock Disponible: 100│
└──────────────────────┘

PASO 1: Cliente agrega 5 unidades al carrito
┌──────────────────────┐
│ Stock Físico: 100    │
│ Stock Reservado: 0   │
│ Stock Disponible: 100│ (No cambia en carrito temporal)
└──────────────────────┘

PASO 2: Crea orden (checkout)
┌──────────────────────┐
│ Stock Físico: 100    │
│ Stock Reservado: 5   │ ← RESERVADO
│ Stock Disponible: 95 │
└──────────────────────┘

PASO 3: Pago confirmado
┌──────────────────────┐
│ Stock Físico: 95     │ ← DESGLOSADO
│ Stock Reservado: 0   │
│ Stock Disponible: 95 │
└──────────────────────┘

PASO 4: Devolución (si aplica)
┌──────────────────────┐
│ Stock Físico: 100    │ ← REGRESA
│ Stock Reservado: 0   │
│ Stock Disponible: 100│
└──────────────────────┘
```

### 3. Flujo de Pago con PayPal

```
┌─────────────────────────────────────────┐
│ 1. INICIAR TRANSACCIÓN                  │
├─────────────────────────────────────────┤
│ • Frontend carga PayPal JS SDK          │
│ • Backend proporciona Client ID         │
│ • Renderiza botón de PayPal             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ 2. CREAR ORDEN EN PAYPAL                │
├─────────────────────────────────────────┤
│ • Frontend: Cliente hace clic en botón  │
│ • Backend llama PayPal /v2/orders       │
│ • PayPal devuelve orderID y links       │
│ • Orden DB creada: estado "pendiente"   │
│ • Stock reservado                       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ 3. AUTORIZAR EN PAYPAL                  │
├─────────────────────────────────────────┤
│ • Cliente autenticado en PayPal         │
│ • Revisa monto y detalles               │
│ • Aprueba la transacción                │
│ • Redirige a frontend                   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ 4. CAPTURAR PAGO                        │
├─────────────────────────────────────────┤
│ • Backend llama /v2/orders/{id}/capture │
│ • PayPal obtiene fondos de cliente      │
│ • Retorna transactionId                 │
│ • Crea registro en ord_transacciones    │
│ • Estado orden → "pagada"               │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ 5. CONFIRMAR Y DESGLOSAR STOCK          │
├─────────────────────────────────────────┤
│ • Cambia estado a "en_proceso"          │
│ • Desgloša stock del inventario         │
│ • Crea historial de movimiento          │
│ • Genera PDF de comprobante             │
│ • Notificación a cliente y admin        │
└─────────────────────────────────────────┘
```

---

## 🗄️ Gestión de Datos

### Esquema de Base de Datos

```sql
-- SEGURIDAD
seg_usuarios
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── nombre_completo
├── activo
└── timestamps

seg_roles
├── id (PK)
├── nombre (UNIQUE)
└── descripcion

seg_permisos
├── id (PK)
├── modulo
└── accion
└── unique(modulo, accion)

-- CATÁLOGO
cat_categorias
├── id (PK)
├── nombre
└── descripcion

cat_productos
├── id (PK)
├── nombre
├── sku (UNIQUE)
├── descripcion
├── precioVenta
├── precioOferta (nullable)
├── estado (ENUM)
├── categoriaId (FK)
├── creador (FK → seg_usuarios)
└── timestamps

cat_imagenes_productos
├── id (PK)
├── productoId (FK)
├── urlImagen
├── orden
└── esImagenPrincipal

-- CLIENTES
cli_clientes
├── id (PK)
├── usuarioId (FK, UNIQUE)
└── timestamps

cli_lista_deseos
├── id (PK)
├── productoId (FK)
└── clienteId (FK)

cli_direcciones
├── id (PK)
├── clienteId (FK)
├── direccion
├── ciudad
└── esPrincipal

-- ÓRDENES
ord_ordenes
├── id (PK)
├── codigoOrden (UNIQUE)
├── clienteId (FK)
├── estadoId (FK)
├── subtotal
├── envio
├── igv
├── total
└── timestamps

ord_items_ordenes
├── id (PK)
├── ordenId (FK)
├── productoId (FK)
├── cantidad
├── precioUnitario
└── subtotal

ord_pagos
├── id (PK)
├── ordenId (FK)
├── metodoPago
├── monto
├── estado
└── timestamps

ord_transacciones_pago
├── id (PK)
├── pagoId (FK)
├── transactionId
├── respuesta (JSON)
└── fecha

ord_historial_estado
├── id (PK)
├── ordenId (FK)
├── estadoId (FK)
├── comentario
└── fecha

-- INVENTARIO
inv_stock_producto
├── productoId (FK, PK)
├── stockFisico
├── stockReservado
└── timestamps

inv_proveedores
├── id (PK)
├── nombre
├── contacto
├── ciudad
└── timestamps

inv_movimientos_inventario
├── id (PK)
├── productoId (FK)
├── tipo (ENUM: entrada, salida, ajuste, reserva)
├── cantidad
├── motivo
├── usuario (FK)
└── timestamps
```

### Transacciones Críticas

**1. Crear Orden**
```typescript
BEGIN TRANSACTION
  ├─ Crea ord_ordenes (status: pendiente)
  ├─ Crea ord_items_ordenes
  ├─ Actualiza inv_stock_producto (reserva stock)
  ├─ Crea inv_movimientos_inventario (tipo: reserva)
  └─ COMMIT o ROLLBACK
```

**2. Capturar Pago PayPal**
```typescript
BEGIN TRANSACTION
  ├─ Actualiza ord_pagos (estado: capturado)
  ├─ Crea ord_transacciones_pago
  ├─ Actualiza ord_ordenes (status: pagada)
  ├─ Crea ord_historial_estado
  ├─ Desgloса inv_stock_producto
  ├─ Crea inv_movimientos_inventario (tipo: salida)
  └─ COMMIT o ROLLBACK
```

### Locks y Concurrencia

Se utilizan **locks pesimistas** en Prisma para evitar race conditions:

```typescript
// Lock pesimista al leer stock
const stock = await prisma.invStockProducto.findUnique({
  where: { productoId: id },
  select: { stockFisico: true, stockReservado: true }
  // Transacción envolvente previene cambios
});
```

---

## 🔒 Seguridad

### 1. Autenticación

**Método:** JWT (JSON Web Tokens)

```typescript
// Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "securePass123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "email": "user@example.com",
    "roles": ["Cliente"],
    "nombreCompleto": "Juan Pérez"
  }
}

// Token en Header
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Características:**
- Algoritmo HS256 con clave secreta
- Expiración configurable (1 hora por defecto)
- Renovación automática si aplica

### 2. Autorización (RBAC)

```typescript
// Middleware de protección
app.get('/admin/dashboard', 
  proteger,                    // Verifica JWT
  requerirRol(['Administrador']), // Verifica rol
  controlador
);

// En controladores
const usuarioId = req.usuario?.id;
const roles = req.usuario?.roles;
```

### 3. Validación de Entrada

```typescript
// Zod schemas
const crearProductoSchema = z.object({
  nombre: z.string().min(3).max(100),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  precioVenta: z.number().positive(),
  precioOferta: z.number().positive().optional()
});

// Validación automática en rutas
POST /productos → schema.parse(req.body)
```

### 4. Protección HTTP

```typescript
// Helmet
- X-Frame-Options: DENY (evita clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content Security Policy

// CORS
- Origen configurable
- Métodos permitidos
- Credenciales incluidas

// Rate Limiting
- 100 requests por 15 minutos por IP
- Endpoints sensibles: límites más restrictivos
```

### 5. Encriptación

```typescript
// Contraseñas con Bcrypt
- Salt rounds: 10
- Algoritmo: bcrypt
- Validación en login

// Datos sensibles en BD
- No se almacenan tokens PayPal
- No se guardan números de tarjeta
- Tokens con expiración
```

### 6. Auditoría

```typescript
// Cada acción crítica se registra
INSERT INTO seg_auditoria
- usuarioId
- accion (CREATE, UPDATE, DELETE)
- modulo
- tablaAfectada
- registroId
- datosAnteriores (JSON)
- datosNuevos (JSON)
- fecha
```

### 7. Validación de Negocio

```typescript
// Operaciones de compra
- Stock disponible > cantidad solicitada ✅
- Precio coincide en BD (no en cliente) ✅
- Cliente autenticado ✅
- Monto PayPal = Monto BD ✅

// Cambios de estado
- Transiciones válidas según diagrama ✅
- Usuario tiene permisos ✅
- Orden existe y es del usuario ✅
```

---

## 💳 Integración de Pagos

### PayPal Checkout v2

**Configuración:**
```env
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_client_secret
PAYPAL_MODE=sandbox  # o production
```

**Flujo Autorizar + Capturar:**

1. **Crear Orden (Authorization)**
   ```
   POST https://api-m.sandbox.paypal.com/v2/checkout/orders
   {
     "intent": "CAPTURE",
     "payer": { "email_address": "customer@example.com" },
     "purchase_units": [{
       "amount": {
         "currency_code": "USD",
         "value": "12.99",
         "breakdown": {
           "item_total": { "currency_code": "USD", "value": "12.99" }
         }
       }
     }],
     "application_context": {
       "return_url": "https://example.com/checkout/success",
       "cancel_url": "https://example.com/checkout/cancel"
     }
   }
   ```

2. **Capturar Pago (Capture)**
   ```
   POST https://api-m.sandbox.paypal.com/v2/checkout/orders/{ORDER_ID}/capture
   ```

3. **Verificar Estado**
   ```
   GET https://api-m.sandbox.paypal.com/v2/checkout/orders/{ORDER_ID}
   ```

**Conversión de Moneda:**
- Sistema en Soles (PEN)
- PayPal en Dólares (USD)
- Tipo de cambio: Se obtiene en tiempo real o configurable

**Manejo de Errores:**
```typescript
// Errores comunes
400: Bad Request → Datos inválidos
401: Unauthorized → Credenciales PayPal
422: Unprocessable → Monto inválido
500: Server Error → Reintentar
```

---

## 🔌 APIs y Endpoints

### Base URL
```
http://localhost:4000/api/v1
```

### Autenticación
```
Header: Authorization: Bearer {accessToken}
```

### Estructura de Respuesta

**Exitosa (200-201):**
```json
{
  "success": true,
  "data": { /* datos */ }
}
```

**Error (4xx-5xx):**
```json
{
  "success": false,
  "error": "Mensaje de error",
  "statusCode": 400,
  "details": { /* detalles adicionales */ }
}
```

### Endpoints Principales

#### 🔐 Autenticación
```
POST   /auth/login                    - Iniciar sesión
POST   /auth/registro-cliente         - Registro de cliente
```

#### 📦 Productos
```
GET    /productos/tienda              - Listar productos (público)
GET    /productos/tienda?busqueda=... - Con filtros
GET    /productos/:id                 - Detalle de producto
POST   /admin/productos               - Crear (Admin)
PUT    /admin/productos/:id           - Actualizar (Admin)
DELETE /admin/productos/:id           - Eliminar (Admin)
GET    /productos/stock               - Verificar stock
POST   /admin/productos/imagenes      - Subir imágenes
```

#### 🛒 Carrito y Órdenes
```
POST   /ordenes/carrito               - Agregar al carrito
GET    /ordenes/carrito               - Obtener carrito
POST   /ordenes/checkout              - Realizar compra
GET    /clientes/ordenes              - Mis órdenes
GET    /clientes/ordenes/:id          - Detalle de orden
GET    /clientes/ordenes/:id/pdf      - Descargar comprobante
```

#### 💰 Pagos PayPal
```
POST   /pagos/paypal/crear-orden      - Crear orden PayPal
POST   /pagos/paypal/capturar         - Capturar pago
GET    /pagos/paypal/estado           - Verificar estado
GET    /pagos/paypal/probar           - Test conexión
```

#### 👤 Clientes
```
GET    /clientes/deseos               - Lista de deseos
POST   /clientes/deseos               - Agregar a deseos
DELETE /clientes/deseos/:id           - Quitar de deseos
GET    /clientes/direcciones          - Mis direcciones
POST   /clientes/direcciones          - Crear dirección
```

#### 📊 Reportes
```
GET    /reportes/ordenes-periodo      - Órdenes por período
GET    /reportes/inventario-valorizado - Stock valorizado
GET    /reportes/stock-bajo           - Productos bajo umbral
GET    /reportes/rentabilidad         - Análisis de margen
```

#### 📈 Estadísticas
```
GET    /estadisticas/abc              - Análisis ABC
GET    /estadisticas/rfm              - Segmentación clientes
GET    /estadisticas/resumen          - KPIs generales
```

#### 📊 Ventas (Gerente Ventas)
```
GET    /ventas/dashboard              - Dashboard KPIs
GET    /ventas/ordenes                - Órdenes recientes
GET    /ventas/clientes/:id           - Perfil de cliente
```

#### 📦 Inventario (Gerente Inventario)
```
GET    /inventario/dashboard          - Resumen stock
GET    /inventario/productos          - Productos con stock
POST   /inventario/ajustar-stock      - Ajuste manual
GET    /inventario/movimientos        - Historial
GET    /inventario/proveedores        - Listar proveedores
POST   /inventario/ordenes-compra     - Crear OC
POST   /inventario/recibir            - Recibir mercadería
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Ejemplo |
|--------|------------|---------|
| 200 | OK - Solicitud exitosa | GET exitoso |
| 201 | Created - Recurso creado | POST de producto |
| 400 | Bad Request - Datos inválidos | Email duplicado |
| 401 | Unauthorized - No autenticado | Token expirado |
| 403 | Forbidden - Sin permisos | Gerente accede admin |
| 404 | Not Found - Recurso no existe | Producto inexistente |
| 409 | Conflict - Conflicto de datos | SKU duplicado |
| 422 | Unprocessable - Negocio inválido | Stock insuficiente |
| 500 | Internal Server Error | Error del sistema |
| 502 | Bad Gateway - Servicio externo | PayPal no responde |

### Errores Comunes

**1. Stock Insuficiente**
```json
{
  "success": false,
  "error": "Stock insuficiente",
  "details": {
    "disponible": 5,
    "solicitado": 10,
    "faltante": 5
  }
}
```

**2. PayPal Falla**
```json
{
  "success": false,
  "error": "PayPal API error (422)",
  "statusCode": 502,
  "paypal": {
    "name": "INVALID_REQUEST",
    "message": "Invalid request"
  }
}
```

**3. No Autenticado**
```json
{
  "success": false,
  "error": "Token no válido o expirado",
  "statusCode": 401
}
```

### Reintentos y Recuperación

```typescript
// Cliente
- Network error: Reintentar con backoff exponencial
- PayPal: Usuario puede volver a intentar
- Stock: Mostrar stock actual disponible
- Auth: Redirigir a login si token expirado
```

---

## 🚀 Despliegue y Configuración

### Variables de Entorno

**.env Backend**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/stockflow
JWT_SECRET=tu_secreto_largo_y_seguro
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_client_secret
PAYPAL_MODE=sandbox
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=4000
```

**.env Frontend**
```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_PAYPAL_CLIENT_ID=tu_client_id
```

### Comandos Útiles

```bash
# Backend
npm install              # Instalar dependencias
npm run dev             # Ejecutar en desarrollo
npm run build           # Compilar TypeScript
npm start               # Ejecutar producción
npx prisma migrate dev  # Migrar BD en desarrollo
npx prisma studio      # UI de BD

# Frontend
npm install             # Instalar dependencias
npm run dev            # Desarrollo con Vite
npm run build          # Producción
npm run preview        # Previsualizar build
```

---

## 📝 Conclusión

**StockFlow** es un sistema empresarial completo que integra:

✅ **E-commerce moderno** con carrito, checkout y pago online  
✅ **Gestión de inventario** en tiempo real  
✅ **Análisis de negocio** con reportes y estadísticas  
✅ **Control de acceso** mediante roles y permisos  
✅ **Seguridad de datos** con encriptación y auditoría  
✅ **Escalabilidad** con arquitectura modular  

El sistema está diseñado para crecer con el negocio y adaptarse a nuevas necesidades.

---

**Última actualización:** Abril 2026  
**Estado:** ✅ Producción  
**Mantenedor:** Equipo de Desarrollo
