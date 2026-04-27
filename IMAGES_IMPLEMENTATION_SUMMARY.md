# Implementación de Gestión de Imágenes para Productos

## Resumen
Se ha implementado un sistema completo para la gestión de múltiples imágenes por producto, incluyendo subida, visualización, eliminación y establecimiento de imagen principal.

## Cambios Realizados

### 1. Backend

#### Dependencias Agregadas
- `multer`: Para manejo de subida de archivos
- `@types/multer`: Tipos de TypeScript para multer

#### Nuevos Archivos
- `backend/src/middlewares/upload.middleware.ts`: Configuración de multer para subida de imágenes
  - Límite de 5MB por archivo
  - Máximo 10 imágenes por producto
  - Solo permite formatos: JPEG, JPG, PNG, GIF, WebP
  - Almacenamiento en `backend/uploads/productos/`

#### Actualizaciones en Controladores
- `backend/src/controllers/producto.controller.ts`:
  - `subirImagenesProducto()`: Sube múltiples imágenes para un producto
  - `obtenerImagenesProducto()`: Obtiene todas las imágenes de un producto ordenadas
  - `eliminarImagenProducto()`: Elimina una imagen específica (archivo físico y registro BD)
  - `establecerImagenPrincipal()`: Establece una imagen como principal (orden 0)

#### Nuevas Rutas API
```
POST   /api/v1/productos/:id/imagenes          - Subir imágenes
GET    /api/v1/productos/:id/imagenes          - Obtener imágenes
DELETE /api/v1/productos/:id/imagenes/:imagenId - Eliminar imagen
PUT    /api/v1/productos/:id/imagenes/:imagenId/principal - Establecer principal
```

#### Configuración de Archivos Estáticos
- `backend/src/app.ts`: Se agregó middleware para servir archivos estáticos desde `/uploads`

### 2. Frontend

#### Dependencias Agregadas
- `lucide-react`: Para iconos (Upload, X, Star, Image)

#### Actualizaciones
- `frontend/src/pages/admin/ProductFormPage.tsx`:
  - Sección completa para gestión de imágenes
  - Previsualización de imágenes antes de subir
  - Grid de imágenes existentes con indicadores visuales
  - Botón para establecer imagen principal (estrella amarilla)
  - Botón para eliminar imágenes
  - Contador de imágenes (máximo 10)
  - Subida asíncrona después de guardar el producto

- `frontend/src/pages/admin/ProductsAdminPage.tsx`:
  - Nueva columna "Imagen" en la tabla de productos
  - Muestra miniatura de imagen principal
  - Manejo de errores de carga de imagen
  - Fallback para productos sin imagen

## Estructura de Base de Datos

El sistema utiliza el modelo existente `CatImagenProducto`:
```prisma
model CatImagenProducto {
  id            Int         @id @default(autoincrement())
  productoId    Int         @map("producto_id")
  urlImagen     String      @map("url_imagen") @db.VarChar(500)
  orden         Int         @default(0)
  fechaCreacion DateTime    @default(now()) @map("fecha_creacion")
  producto      CatProducto @relation(fields: [productoId], references: [id], onDelete: Cascade)

  @@map("cat_imagenes_producto")
}
```

- `orden = 0`: Imagen principal
- `orden > 0`: Imágenes secundarias (ordenadas ascendentemente)

## Flujo de Uso

### Crear Producto con Imágenes
1. Crear producto con datos básicos
2. El sistema redirige automáticamente después de guardar
3. Si hay archivos pendientes, se suben automáticamente
4. Las imágenes se asocian al producto creado

### Editar Producto con Imágenes
1. Cargar datos del producto
2. Cargar imágenes existentes
3. Mostrar imágenes con indicador de principal (estrella)
4. Permitir agregar nuevas imágenes (previsualización)
5. Permitir eliminar imágenes existentes
6. Permitir cambiar imagen principal
7. Subir nuevas imágenes cuando el usuario lo solicite

### Eliminar Imagen
1. Verificar que la imagen pertenece al producto
2. Eliminar archivo físico del servidor
3. Eliminar registro de base de datos
4. Reordenar imágenes restantes
5. Si era principal, establecer la siguiente como principal
6. Si no quedan imágenes, limpiar campo `imagenUrl` del producto

## Características de Seguridad

1. **Validación de Archivos**:
   - Solo imágenes (JPEG, JPG, PNG, GIF, WebP)
   - Máximo 5MB por archivo
   - Máximo 10 archivos por solicitud

2. **Limpieza en Error**:
   - Si falla la subida, se eliminan los archivos subidos
   - No quedan archivos huérfanos en el servidor

3. **Autorización**:
   - Todas las rutas requieren rol `inventario:editar` o `inventario:leer`
   - Verificación de propiedad (imagen pertenece al producto)

## URLs de Imágenes

Las imágenes se almacenan con rutas relativas:
- Formato: `/uploads/productos/[nombre-archivo]`
- Servidas estáticamente desde `backend/uploads/productos/`
- En frontend se construye URL completa usando `import.meta.env.VITE_API_URL`

## Consideraciones de Producción

1. **Almacenamiento**: Actualmente usa almacenamiento local. Para producción considerar:
   - AWS S3
   - Cloudinary
   - Azure Blob Storage

2. **Optimización**:
   - Las imágenes no se redimensionan automáticamente
   - Considerar agregar procesamiento de imágenes (sharp, jimp)
   - Generar thumbnails para mejor rendimiento

3. **CDN**:
   - Configurar CDN para servir imágenes
   - Mejorar tiempos de carga

## Pruebas Recomendadas

1. Subir una imagen
2. Subir múltiples imágenes (hasta 10)
3. Establecer imagen principal
4. Eliminar imagen principal (verificar que la siguiente sea principal)
5. Eliminar todas las imágenes
6. Intentar subir archivo no válido (>5MB, otro formato)
7. Verificar que las imágenes se muestran en lista de productos
8. Verificar que las imágenes se muestran en formulario de edición

## Estado Actual

✅ **COMPLETADO**: Sistema funcional de gestión de imágenes
- Subida múltiple de imágenes
- Visualización en lista y formulario
- Eliminación de imágenes
- Establecimiento de imagen principal
- Previsualización antes de subir
- Integración completa backend-frontend

El sistema está listo para usarse y permite a los administradores gestionar hasta 10 imágenes por producto de manera intuitiva y eficiente.