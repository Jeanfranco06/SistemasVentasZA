-- CREATE DATABASE stockflow1 WITH ENCODING 'UTF8';
-- \c stockflow1;

-- Extension para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================
-- TABLAS DE SEGURIDAD Y CONFIGURACIÓN
-- =========================================
CREATE TABLE IF NOT EXISTS seg_roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seg_permisos (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    descripcion TEXT,
    UNIQUE (modulo, accion)
);

CREATE TABLE IF NOT EXISTS seg_rol_permiso (
    rol_id INT REFERENCES seg_roles(id) ON DELETE CASCADE,
    permiso_id INT REFERENCES seg_permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS seg_usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seg_usuario_rol (
    usuario_id INT REFERENCES seg_usuarios(id) ON DELETE CASCADE,
    rol_id INT REFERENCES seg_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS seg_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monedas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(3) UNIQUE NOT NULL, -- Ej: PEN, USD
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipo_cambio (
    id SERIAL PRIMARY KEY,
    moneda_origen_id INT REFERENCES monedas(id),
    moneda_destino_id INT REFERENCES monedas(id),
    tasa DECIMAL(10, 4) NOT NULL,
    fecha_valida DATE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'string',
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLAS DE CATÁLOGO
-- =========================================
CREATE TABLE IF NOT EXISTS cat_categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    prefijo_sku VARCHAR(3) NOT NULL UNIQUE, -- REGLA DE NEGOCIO CRÍTICA
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_prefijo_sku CHECK (prefijo_sku ~ '^[A-Z]{3}$')
);

CREATE TABLE IF NOT EXISTS cat_subcategorias (
    id SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL REFERENCES cat_categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cat_marcas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cat_unidades_medida (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Ej: Unidad, Kilogramo, Litro
    abreviatura VARCHAR(10) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cat_productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(500),
    categoria_id INT NOT NULL REFERENCES cat_categorias(id) ON DELETE RESTRICT,
    subcategoria_id INT REFERENCES cat_subcategorias(id) ON DELETE SET NULL,
    marca_id INT REFERENCES cat_marcas(id) ON DELETE SET NULL,
    unidad_medida_id INT REFERENCES cat_unidades_medida(id) ON DELETE SET NULL,
    precio_costo DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    precio_oferta DECIMAL(12, 2),
    peso DECIMAL(8, 3),
    largo DECIMAL(8, 2),
    ancho DECIMAL(8, 2),
    alto DECIMAL(8, 2),
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('activo', 'inactivo', 'borrador')),
    creado_por INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sku_formato CHECK (sku ~ '^[A-Z]{3}-\d{3,}$')
);

-- Compatibilidad con bases ya creadas previamente
ALTER TABLE cat_productos
ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500);

CREATE INDEX idx_productos_sku ON cat_productos(sku);
CREATE INDEX idx_productos_nombre ON cat_productos USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_productos_categoria ON cat_productos(categoria_id);

CREATE TABLE IF NOT EXISTS cat_imagenes_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES cat_productos(id) ON DELETE CASCADE,
    url_imagen VARCHAR(500) NOT NULL,
    orden INT DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cat_atributos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cat_valores_atributo (
    id SERIAL PRIMARY KEY,
    atributo_id INT NOT NULL REFERENCES cat_atributos(id) ON DELETE CASCADE,
    valor VARCHAR(100) NOT NULL,
    UNIQUE (atributo_id, valor)
);

CREATE TABLE IF NOT EXISTS cat_producto_atributo (
    producto_id INT REFERENCES cat_productos(id) ON DELETE CASCADE,
    valor_atributo_id INT REFERENCES cat_valores_atributo(id) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, valor_atributo_id)
);

CREATE TABLE IF NOT EXISTS cat_etiquetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cat_producto_etiqueta (
    producto_id INT REFERENCES cat_productos(id) ON DELETE CASCADE,
    etiqueta_id INT REFERENCES cat_etiquetas(id) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, etiqueta_id)
);

-- =========================================
-- TABLAS DE INVENTARIO
-- =========================================
CREATE TABLE IF NOT EXISTS inv_proveedores (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    contacto VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inv_stock_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT UNIQUE NOT NULL REFERENCES cat_productos(id) ON DELETE CASCADE,
    stock_fisico INT NOT NULL DEFAULT 0 CHECK (stock_fisico >= 0),
    stock_reservado INT NOT NULL DEFAULT 0 CHECK (stock_reservado >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inv_movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES cat_productos(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'reserva', 'liberacion')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    motivo VARCHAR(100),
    referencia_id INT, -- Puede ser ord_ordenes.id o inv_ajustes.id
    creado_por INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inv_ajustes (
    id SERIAL PRIMARY KEY,
    motivo VARCHAR(200) NOT NULL,
    creado_por INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inv_detalle_ajuste (
    ajuste_id INT REFERENCES inv_ajustes(id) ON DELETE CASCADE,
    producto_id INT REFERENCES cat_productos(id) ON DELETE CASCADE,
    cantidad_ajustada INT NOT NULL,
    PRIMARY KEY (ajuste_id, producto_id)
);

CREATE TABLE IF NOT EXISTS inv_ordenes_compra (
    id SERIAL PRIMARY KEY,
    proveedor_id INT NOT NULL REFERENCES inv_proveedores(id) ON DELETE RESTRICT,
    fecha_esperada DATE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'recibida', 'cancelada')),
    creado_por INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inv_detalle_orden_compra (
    orden_compra_id INT REFERENCES inv_ordenes_compra(id) ON DELETE CASCADE,
    producto_id INT REFERENCES cat_productos(id) ON DELETE CASCADE,
    cantidad_pedida INT NOT NULL,
    costo_unitario DECIMAL(12, 2) NOT NULL,
    PRIMARY KEY (orden_compra_id, producto_id)
);

CREATE TABLE IF NOT EXISTS inv_recepciones (
    id SERIAL PRIMARY KEY,
    orden_compra_id INT REFERENCES inv_ordenes_compra(id) ON DELETE CASCADE,
    recibido_por INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLAS DE CLIENTES
-- =========================================
CREATE TABLE IF NOT EXISTS cli_clientes (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(20) UNIQUE,
    razon_social VARCHAR(200),
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    segmento VARCHAR(20) DEFAULT 'nuevo' CHECK (segmento IN ('nuevo', 'recurrente', 'vip', 'inactivo')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cli_direcciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES cli_clientes(id) ON DELETE CASCADE,
    alias VARCHAR(50),
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cli_lista_deseos (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES cli_clientes(id) ON DELETE CASCADE,
    nombre VARCHAR(50) DEFAULT 'Principal',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cli_items_lista_deseos (
    lista_deseo_id INT REFERENCES cli_lista_deseos(id) ON DELETE CASCADE,
    producto_id INT REFERENCES cat_productos(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lista_deseo_id, producto_id)
);

CREATE TABLE IF NOT EXISTS cli_resenas_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES cat_productos(id) ON DELETE CASCADE,
    cliente_id INT NOT NULL REFERENCES cli_clientes(id) ON DELETE CASCADE,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLAS DE ÓRDENES
-- =========================================
CREATE TABLE IF NOT EXISTS ord_metodos_envio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    costo_base DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ord_estados_orden (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL -- pendiente_pago, pagada, en_proceso, etc.
);

CREATE TABLE IF NOT EXISTS ord_carritos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES cli_clientes(id) ON DELETE CASCADE,
    session_id VARCHAR(100), -- Para invitados
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ord_items_carrito (
    id SERIAL PRIMARY KEY,
    carrito_id INT NOT NULL REFERENCES ord_carritos(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES cat_productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha_agregado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ord_ordenes (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES cli_clientes(id) ON DELETE RESTRICT,
    codigo_orden VARCHAR(20) UNIQUE NOT NULL,
    estado_id INT NOT NULL REFERENCES ord_estados_orden(id),
    metodo_envio_id INT REFERENCES ord_metodos_envio(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    impuesto_igv DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    costo_envio DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    descuento DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ord_direcciones_envio (
    id SERIAL PRIMARY KEY,
    orden_id INT UNIQUE NOT NULL REFERENCES ord_ordenes(id) ON DELETE CASCADE,
    alias VARCHAR(50),
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    destinatario_nombre VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS ord_items_orden (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ord_ordenes(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES cat_productos(id) ON DELETE RESTRICT,
    producto_nombre VARCHAR(200) NOT NULL, -- Denormalizado para historial
    sku VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS ord_pagos (
    id SERIAL PRIMARY KEY,
    orden_id INT UNIQUE NOT NULL REFERENCES ord_ordenes(id) ON DELETE CASCADE,
    metodo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ord_transacciones_pago (
    id SERIAL PRIMARY KEY,
    pago_id INT NOT NULL REFERENCES ord_pagos(id) ON DELETE CASCADE,
    gateway_transaccion_id VARCHAR(200),
    estado VARCHAR(20) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    respuesta_json JSONB,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ord_historial_estados (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ord_ordenes(id) ON DELETE CASCADE,
    estado_id INT NOT NULL REFERENCES ord_estados_orden(id),
    comentario TEXT,
    creado_por INT REFERENCES seg_usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- DATOS SEMILLA (SEED)
-- =========================================
INSERT INTO monedas (codigo, nombre, simbolo) VALUES 
('PEN', 'Soles', 'S/'), 
('USD', 'Dólares', '$') ON CONFLICT (codigo) DO NOTHING;

INSERT INTO seg_roles (nombre, descripcion) VALUES 
('Cliente', 'Acceso a tienda y sus compras'),
('Administrador', 'Acceso total al sistema'),
('Gerente Ventas', 'Dashboard y gestión de ventas'),
('Gerente Inventario', 'Gestión de stock y compras'),
('Vendedor', 'Procesamiento de órdenes básicas') ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_categorias (nombre, prefijo_sku) VALUES 
('Electrónica', 'ELE'), 
('Ropa y Moda', 'ROP'), 
('Hogar y Cocina', 'HOG'), 
('Deportes', 'DEP') ON CONFLICT (prefijo_sku) DO NOTHING;

INSERT INTO cat_marcas (nombre) VALUES 
('TechCorp'), ('FashionLine'), ('HomeMax'), ('SportPro') ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_unidades_medida (nombre, abreviatura) VALUES 
('Unidad', 'UND'), ('Kilogramo', 'KG'), ('Litro', 'LT') ON CONFLICT DO NOTHING;

-- INSERCIÓN DE 20 PRODUCTOS DE EJEMPLO (Respetando lógica de SKU crítico)
INSERT INTO cat_productos (sku, nombre, categoria_id, marca_id, unidad_medida_id, precio_costo, precio_venta, estado) VALUES
('ELE-001', 'Smartphone Galaxy X', 1, 1, 1, 800.00, 1200.00, 'activo'),
('ELE-002', 'Laptop ProBook 15', 1, 1, 1, 1500.00, 2200.00, 'activo'),
('ELE-003', 'Audífonos Bluetooth', 1, 1, 1, 50.00, 90.00, 'activo'),
('ELE-004', 'Cargador Rápido USB-C', 1, 1, 1, 15.00, 35.00, 'activo'),
('ELE-005', 'Monitor 4K 27 pulgadas', 1, 1, 1, 400.00, 650.00, 'activo'),
('ROP-001', 'Camiseta Algodón Classic', 2, 2, 1, 10.00, 25.00, 'activo'),
('ROP-002', 'Jeans Slim Fit', 2, 2, 1, 20.00, 55.00, 'activo'),
('ROP-003', 'Zapatillas Running', 2, 4, 1, 40.00, 85.00, 'activo'),
('ROP-004', 'Chaqueta Impermeable', 2, 2, 1, 35.00, 75.00, 'activo'),
('ROP-005', 'Cinturón Cuero Genuine', 2, 2, 1, 15.00, 40.00, 'activo'),
('HOG-001', 'Olla de Presión 6L', 3, 3, 1, 25.00, 55.00, 'activo'),
('HOG-002', 'Juego de Sartenes Antiadherente', 3, 3, 1, 30.00, 70.00, 'activo'),
('HOG-003', 'Licuadora de Vaso 700W', 3, 3, 1, 20.00, 45.00, 'activo'),
('HOG-004', 'Lámpara LED de Escritorio', 3, 3, 1, 12.00, 30.00, 'activo'),
('HOG-005', 'Organizador de Ropa', 3, 3, 1, 8.00, 20.00, 'activo'),
('DEP-001', 'Balón de Fútbol Oficial', 4, 4, 1, 25.00, 50.00, 'activo'),
('DEP-002', 'Mat de Yoga Antideslizante', 4, 4, 1, 15.00, 35.00, 'activo'),
('DEP-003', 'Mancuernas Ajustables 20kg', 4, 4, 1, 40.00, 80.00, 'activo'),
('DEP-004', 'Bicicleta Estática Plegable', 4, 4, 1, 200.00, 350.00, 'activo'),
('DEP-005', 'Botella de Agua Térmica 1L', 4, 4, 1, 10.00, 25.00, 'activo') ON CONFLICT (sku) DO NOTHING;

-- Inserción de Stock para los 20 productos
INSERT INTO inv_stock_producto (producto_id, stock_fisico, stock_minimo)
SELECT id, CASE WHEN id % 3 = 0 THEN 2 ELSE 50 END, 5 FROM cat_productos ON CONFLICT (producto_id) DO NOTHING;