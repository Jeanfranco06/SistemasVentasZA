-- CreateTable
CREATE TABLE "seg_roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_permisos" (
    "id" SERIAL NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(50) NOT NULL,

    CONSTRAINT "seg_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_rol_permiso" (
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,

    CONSTRAINT "seg_rol_permiso_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "seg_usuarios" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_usuario_rol" (
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,

    CONSTRAINT "seg_usuario_rol_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- CreateTable
CREATE TABLE "seg_auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "tabla_afectada" VARCHAR(50),
    "registro_id" INTEGER,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "ip_address" VARCHAR(45),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "prefijo_sku" VARCHAR(3) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_subcategorias" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_marcas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_unidades_medida" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "abreviatura" VARCHAR(10) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_productos" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "categoria_id" INTEGER NOT NULL,
    "subcategoria_id" INTEGER,
    "marca_id" INTEGER,
    "unidad_medida_id" INTEGER,
    "precio_costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "precio_oferta" DECIMAL(12,2),
    "peso" DECIMAL(8,3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'borrador',
    "creado_por" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_imagenes_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "url_imagen" VARCHAR(500) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_atributos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "cat_atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_valores_atributo" (
    "id" SERIAL NOT NULL,
    "atributo_id" INTEGER NOT NULL,
    "valor" VARCHAR(100) NOT NULL,

    CONSTRAINT "cat_valores_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_atributo" (
    "producto_id" INTEGER NOT NULL,
    "valor_atributo_id" INTEGER NOT NULL,

    CONSTRAINT "cat_producto_atributo_pkey" PRIMARY KEY ("producto_id","valor_atributo_id")
);

-- CreateTable
CREATE TABLE "cat_etiquetas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "cat_etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_etiqueta" (
    "producto_id" INTEGER NOT NULL,
    "etiqueta_id" INTEGER NOT NULL,

    CONSTRAINT "cat_producto_etiqueta_pkey" PRIMARY KEY ("producto_id","etiqueta_id")
);

-- CreateTable
CREATE TABLE "cli_clientes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_documento" VARCHAR(20),
    "numero_documento" VARCHAR(20),
    "razon_social" VARCHAR(200),
    "telefono" VARCHAR(20),
    "segmento" VARCHAR(20) NOT NULL DEFAULT 'nuevo',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_direcciones" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "alias" VARCHAR(50),
    "direccion" TEXT NOT NULL,
    "ciudad" VARCHAR(100),
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_lista_deseos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL DEFAULT 'Principal',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_lista_deseos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_items_lista_deseos" (
    "lista_deseo_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "fecha_agregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_items_lista_deseos_pkey" PRIMARY KEY ("lista_deseo_id","producto_id")
);

-- CreateTable
CREATE TABLE "cli_resenas_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_resenas_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_proveedores" (
    "id" SERIAL NOT NULL,
    "ruc" VARCHAR(20) NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "contacto" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_stock_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "stock_fisico" INTEGER NOT NULL DEFAULT 0,
    "stock_reservado" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_stock_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "tipo_movimiento" VARCHAR(20) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" VARCHAR(100),
    "referencia_id" INTEGER,
    "creado_por" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_ordenes_compra" (
    "id" SERIAL NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "creado_por" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_detalle_orden_compra" (
    "orden_compra_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad_pedida" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "inv_detalle_orden_compra_pkey" PRIMARY KEY ("orden_compra_id","producto_id")
);

-- CreateTable
CREATE TABLE "ord_metodos_envio" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "costo_base" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ord_metodos_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_estados_orden" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "ord_estados_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_ordenes" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "codigo_orden" VARCHAR(20) NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "metodo_envio_id" INTEGER,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "impuesto_igv" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costo_envio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_orden" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "producto_nombre" VARCHAR(200) NOT NULL,
    "sku" VARCHAR(20) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ord_items_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_direcciones_envio" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "alias" VARCHAR(50),
    "direccion" TEXT NOT NULL,
    "ciudad" VARCHAR(100),
    "destinatario_nombre" VARCHAR(100),

    CONSTRAINT "ord_direcciones_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_pagos" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "metodo" VARCHAR(50) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "ord_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_transacciones_pago" (
    "id" SERIAL NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "respuesta_json" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_transacciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_historial_estados" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "comentario" TEXT,
    "creado_por" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seg_roles_nombre_key" ON "seg_roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "seg_permisos_modulo_accion_key" ON "seg_permisos"("modulo", "accion");

-- CreateIndex
CREATE UNIQUE INDEX "seg_usuarios_email_key" ON "seg_usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cat_categorias_prefijo_sku_key" ON "cat_categorias"("prefijo_sku");

-- CreateIndex
CREATE UNIQUE INDEX "cat_marcas_nombre_key" ON "cat_marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_productos_sku_key" ON "cat_productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "cat_valores_atributo_atributo_id_valor_key" ON "cat_valores_atributo"("atributo_id", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "cat_etiquetas_nombre_key" ON "cat_etiquetas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_usuario_id_key" ON "cli_clientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_numero_documento_key" ON "cli_clientes"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "inv_proveedores_ruc_key" ON "inv_proveedores"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "inv_stock_producto_producto_id_key" ON "inv_stock_producto"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "ord_estados_orden_nombre_key" ON "ord_estados_orden"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ord_ordenes_codigo_orden_key" ON "ord_ordenes"("codigo_orden");

-- CreateIndex
CREATE UNIQUE INDEX "ord_direcciones_envio_orden_id_key" ON "ord_direcciones_envio"("orden_id");

-- CreateIndex
CREATE UNIQUE INDEX "ord_pagos_orden_id_key" ON "ord_pagos"("orden_id");

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "seg_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "seg_permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "seg_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_auditoria" ADD CONSTRAINT "seg_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_subcategorias" ADD CONSTRAINT "cat_subcategorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_subcategoria_id_fkey" FOREIGN KEY ("subcategoria_id") REFERENCES "cat_subcategorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "cat_marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "cat_unidades_medida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_imagenes_producto" ADD CONSTRAINT "cat_imagenes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_valores_atributo" ADD CONSTRAINT "cat_valores_atributo_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "cat_atributos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_valor_atributo_id_fkey" FOREIGN KEY ("valor_atributo_id") REFERENCES "cat_valores_atributo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_etiqueta_id_fkey" FOREIGN KEY ("etiqueta_id") REFERENCES "cat_etiquetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_clientes" ADD CONSTRAINT "cli_clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_direcciones" ADD CONSTRAINT "cli_direcciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_lista_deseos" ADD CONSTRAINT "cli_lista_deseos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_lista_deseo_id_fkey" FOREIGN KEY ("lista_deseo_id") REFERENCES "cli_lista_deseos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_stock_producto" ADD CONSTRAINT "inv_stock_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_mov_inv_prod_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_mov_inv_stock_fkey" FOREIGN KEY ("producto_id") REFERENCES "inv_stock_producto"("producto_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ordenes_compra" ADD CONSTRAINT "inv_ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "inv_proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "inv_ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "ord_estados_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_metodo_envio_id_fkey" FOREIGN KEY ("metodo_envio_id") REFERENCES "ord_metodos_envio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_direcciones_envio" ADD CONSTRAINT "ord_direcciones_envio_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_pagos" ADD CONSTRAINT "ord_pagos_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_transacciones_pago" ADD CONSTRAINT "ord_transacciones_pago_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "ord_pagos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "ord_estados_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
