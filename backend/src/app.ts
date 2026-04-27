// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import prisma from './lib/prisma.js';
import { proteger, requerirRol } from './middlewares/auth.middleware.js';
import { environment } from './config/env.js';
import { login, registroCliente } from './controllers/auth.controller.js';
import { 
  obtenerSiguienteSku, crearProducto, listarProductosTienda, listarProductosAdmin, 
  obtenerProductoPorId, actualizarProducto, eliminarProducto, obtenerStockProductos, 
  cambiarEstadoProducto, subirImagenesProducto, obtenerImagenesProducto, 
  eliminarImagenProducto, establecerImagenPrincipal 
} from './controllers/producto.controller.js';
import { agregarAlCarrito, checkoutCompleto, sincronizarCarritoBD, getMisOrdenes, cambiarEstadoOrden, listarOrdenesAdmin, obtenerOrdenDetalle, descargarOrdenPDF } from './controllers/orden.controller.js';
import { analisisABC, analisisRFM, resumenEstadisticas } from './controllers/estadisticas.controller.js';
import {
  dashboardInventario, crearProductoDraft, publicarProducto, descontinuarProducto,
  ajustarStock, historialStock, crearOrdenCompra, recibirMercaderia,
  listarProveedores, crearProveedor, actualizarProveedor, eliminarProveedor
} from './controllers/inventario.controller.js';
import {
  dashboardVentas, listarOrdenesVentas,
  obtenerHistorialOrden, perfilCliente
} from './controllers/ventas.controller.js';
import { listarCategoriasAdmin, crearCategoria, actualizarCategoria, eliminarCategoria, listarCategoriasPublicas } from './controllers/categoria.controller.js';
import { 
  repOrdenesPeriodo, repInventarioValorizado, repMovimientosInventario, repStockBajo, 
  repPagosRecibidos, repDevoluciones, repFacturaIndividual, repComprobanteSimplificado,
  repRentabilidadProducto, repVentasCategoria, repComportamientoCarritos, 
  repComportamientoClientes, repRotacionInventario, repIngresosVsCostos
} from './controllers/reporte.controller.js';
import {  getMisDeseos, toggleDeseo, getMisDirecciones, crearDireccion } from './controllers/cliente.controller.js';
import { crearOrdenPayPalController, capturarPagoPayPal, verificarEstadoPago } from './controllers/paypal.controller.js';
import { upload } from './middlewares/upload.middleware.js';
import path from 'path';

const app = express();

// Seguridad y límites
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir archivos estáticos para uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
if (environment.NODE_ENV === 'production') {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
}

// Health Check
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a DB
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'CONNECTED',
        server: 'RUNNING'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        database: 'DISCONNECTED',
        server: 'RUNNING'
      }
    });
  }
});

// Documentación Swagger (OpenAPI 3.0)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'StockFlow API', version: '1.0.0', description: 'Sistema E-Commerce Production-Ready' },
  },
  apis: ['./src/controllers/*.ts'], // Extrae comentarios @swagger de los controladores
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// Rutas Públicas
app.post('/api/v1/auth/login', login);
app.get('/api/v1/productos/tienda', listarProductosTienda);
app.get('/api/v1/categorias', listarCategoriasPublicas); // <--- NUEVA RUTA PÚBLICA

// Rutas Protegidas (JWT)
app.use('/api/v1', proteger);
app.get('/api/v1/productos/admin', requerirRol('inventario', 'leer'), listarProductosAdmin);
app.post('/api/v1/ordenes/carrito/sincronizar', proteger, sincronizarCarritoBD);
app.post('/api/v1/ordenes/checkout', proteger, checkoutCompleto);
// Categorías
app.get('/api/v1/categorias/admin', requerirRol('inventario', 'leer'), listarCategoriasAdmin);
app.post('/api/v1/categorias', requerirRol('inventario', 'crear'), crearCategoria);
app.put('/api/v1/categorias/:id', requerirRol('inventario', 'editar'), actualizarCategoria);
app.delete('/api/v1/categorias/:id', requerirRol('inventario', 'eliminar'), eliminarCategoria);

// Proveedores
app.put('/api/v1/inventario/proveedores/:id', requerirRol('inventario', 'editar'), actualizarProveedor);

// Productos
app.get('/api/v1/productos/admin/:id', requerirRol('inventario', 'leer'), obtenerProductoPorId);
app.put('/api/v1/productos/:id', requerirRol('inventario', 'editar'), actualizarProducto);
app.delete('/api/v1/productos/:id', requerirRol('inventario', 'eliminar'), eliminarProducto);
app.patch('/api/v1/productos/:id/estado', requerirRol('inventario', 'editar'), cambiarEstadoProducto);
app.post('/api/v1/productos/stock-info', obtenerStockProductos);

app.get('/api/v1/productos/next-sku', obtenerSiguienteSku);
app.post('/api/v1/productos', crearProducto);

// Imágenes de productos
app.post('/api/v1/productos/:id/imagenes', requerirRol('inventario', 'editar'), upload.array('imagenes', 10) as any, subirImagenesProducto as any);
app.get('/api/v1/productos/:id/imagenes', requerirRol('inventario', 'leer'), obtenerImagenesProducto as any);
app.delete('/api/v1/productos/:id/imagenes/:imagenId', requerirRol('inventario', 'editar'), eliminarImagenProducto as any);
app.put('/api/v1/productos/:id/imagenes/:imagenId/principal', requerirRol('inventario', 'editar'), establecerImagenPrincipal as any);
app.post('/api/v1/ordenes/carrito', agregarAlCarrito);

// Rutas específicas para Gerente de Ventas
app.get('/api/v1/ventas/dashboard', requerirRol('ordenes', 'leer'), dashboardVentas);
app.get('/api/v1/ventas/ordenes', requerirRol('ordenes', 'leer'), listarOrdenesVentas);
app.put('/api/v1/ventas/ordenes/:ordenId/estado', requerirRol('ordenes', 'editar'), cambiarEstadoOrden);

// Rutas específicas para Gerente de Inventario
app.get('/api/v1/inventario/dashboard', requerirRol('inventario', 'leer'), dashboardInventario);
app.post('/api/v1/inventario/productos/draft', requerirRol('productos', 'crear'), crearProductoDraft);
app.put('/api/v1/inventario/productos/:id/publicar', requerirRol('productos', 'editar'), publicarProducto);
app.put('/api/v1/inventario/productos/:id/descontinuar', requerirRol('productos', 'editar'), descontinuarProducto);
app.post('/api/v1/inventario/stock/ajustar', requerirRol('inventario', 'editar'), ajustarStock);
app.get('/api/v1/inventario/stock/:productoId/historial', requerirRol('inventario', 'leer'), historialStock);
app.post('/api/v1/inventario/ordenes-compra', requerirRol('inventario', 'crear'), crearOrdenCompra);
app.post('/api/v1/inventario/recepciones', requerirRol('inventario', 'editar'), recibirMercaderia);

// Proveedores (compartidos)
app.get('/api/v1/inventario/proveedores', requerirRol('proveedores', 'leer'), listarProveedores);
app.post('/api/v1/inventario/proveedores', requerirRol('proveedores', 'crear'), crearProveedor);
app.put('/api/v1/inventario/proveedores/:id', requerirRol('proveedores', 'editar'), actualizarProveedor);
app.delete('/api/v1/inventario/proveedores/:id', requerirRol('proveedores', 'eliminar'), eliminarProveedor);

// Rutas Protegidas (debajo de las de productos)
app.get('/api/v1/clientes/ordenes', proteger, getMisOrdenes);
app.get('/api/v1/clientes/ordenes/:id/pdf', proteger, descargarOrdenPDF);
app.get('/api/v1/clientes/deseos', proteger, getMisDeseos);
app.post('/api/v1/clientes/deseos', proteger, toggleDeseo);
app.get('/api/v1/clientes/direcciones', proteger, getMisDirecciones);
app.post('/api/v1/clientes/direcciones', proteger, crearDireccion);
// Estadísticas Descriptivas (Requiere rol Gerente/Admin)
app.get('/api/v1/estadisticas/resumen', resumenEstadisticas);
app.get('/api/v1/estadisticas/abc', analisisABC);
app.get('/api/v1/estadisticas/rfm', analisisRFM);

// Clientes/Auth
app.post('/api/v1/auth/registro', registroCliente);

// Inventario y Proveedores (Protegidos por RBAC)
app.get('/api/v1/inventario/proveedores', requerirRol('inventario', 'leer'), listarProveedores);
app.post('/api/v1/inventario/proveedores', requerirRol('inventario', 'crear'), crearProveedor);
app.delete('/api/v1/inventario/proveedores/:id', requerirRol('inventario', 'eliminar'), eliminarProveedor);

// Órdenes Admin
app.get('/api/v1/ordenes/admin', requerirRol('ordenes', 'leer'), listarOrdenesAdmin);
app.get('/api/v1/ordenes/:id', requerirRol('ordenes', 'leer'), obtenerOrdenDetalle);
app.get('/api/v1/ordenes/:id/pdf', requerirRol('ordenes', 'leer'), descargarOrdenPDF);
app.put('/api/v1/ordenes/:id/estado', requerirRol('ordenes', 'editar'), cambiarEstadoOrden);

const reportesRouter = express.Router(); // Opcional: agrupar para mantener el código limpio

// Operacionales (8)
reportesRouter.get('/operacionales/ordenes', repOrdenesPeriodo);
reportesRouter.get('/operacionales/inventario', repInventarioValorizado);
reportesRouter.get('/operacionales/movimientos', repMovimientosInventario);
reportesRouter.get('/operacionales/stock-bajo', repStockBajo);
reportesRouter.get('/operacionales/pagos', repPagosRecibidos);
reportesRouter.get('/operacionales/devoluciones', repDevoluciones);
reportesRouter.get('/operacionales/factura/:ordenId', repFacturaIndividual);
reportesRouter.get('/operacionales/comprobante/:ordenId', repComprobanteSimplificado);

// Gestión (6)
reportesRouter.get('/gestion/rentabilidad', repRentabilidadProducto);
reportesRouter.get('/gestion/ventas-categoria', repVentasCategoria);
reportesRouter.get('/gestion/carritos', repComportamientoCarritos);
reportesRouter.get('/gestion/clientes', repComportamientoClientes);
reportesRouter.get('/gestion/rotacion', repRotacionInventario);
reportesRouter.get('/gestion/ingresos-costos', repIngresosVsCostos);

// Registrar el enrutador bajo el path principal
app.use('/api/v1/reportes', proteger, reportesRouter);

// Rutas de PayPal
app.post('/api/v1/pagos/paypal/crear-orden', proteger, crearOrdenPayPalController);
app.post('/api/v1/pagos/paypal/capturar', proteger, capturarPagoPayPal);
app.get('/api/v1/pagos/paypal/verificar', proteger, verificarEstadoPago);

// Middleware de Errores (Debe ser el último middleware)
app.use(globalErrorHandler as any);

export default app;
