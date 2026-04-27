// frontend/src/services/api.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Si la petición fue cancelada por timeout del navegador, ignorar silenciosamente
    if (axios.isCancel(error) || error.code === 'ECONNABORTED') {
      console.warn('Petición cancelada por timeout');
      return Promise.reject(error);
    }

    // 2. Si NO hay respuesta del servidor (error de red ciego), ignorar
    if (!error.response) {
      console.error('Error de red o el servidor no responde');
      return Promise.reject(error);
    }

    // 3. LA ÚNICA CONDICIÓN PARA CERRAR SESIÓN: Error 401 EXPLÍCITO
    if (error.response.status === 401) {
      // Evitar bucle infinito si falla el refresh
      if (!error.config._retry) {
        error.config._retry = true;
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    // 4. Para cualquier otro error (400, 409, 500), simplemente dejar que el componente lo maneje
    return Promise.reject(error);
  }
);

export default api;

// Funciones de API para órdenes y carrito
export const ordenesApi = {
  sincronizarCarrito: (items: any[]) => api.post('/ordenes/carrito/sincronizar', { items }),
  checkout: (data: any) => api.post('/ordenes/checkout', data),
  getMisOrdenes: () => api.get('/ordenes/mis-ordenes'),
  agregarAlCarrito: (productoId: number, cantidad: number) =>
    api.post('/ordenes/carrito/agregar', { productoId, cantidad }),
};

// Funciones de API para ventas
export const ventasApi = {
  dashboardVentas: () => api.get('/ventas/dashboard'),
  listarOrdenesVentas: (params?: any) => api.get('/ventas/ordenes', { params }),
  cambiarEstadoOrden: (ordenId: number, data: any) =>
    api.put(`/ventas/ordenes/${ordenId}/estado`, data),
  obtenerHistorialOrden: (ordenId: number) => api.get(`/ventas/ordenes/${ordenId}/historial`),
  perfilCliente: (clienteId: number) => api.get(`/ventas/clientes/${clienteId}`),
};

// Funciones de API para inventario
export const inventarioApi = {
  dashboardInventario: () => api.get('/inventario/dashboard'),
  crearProductoDraft: (data: any) => api.post('/inventario/productos/draft', data),
  publicarProducto: (id: number) => api.put(`/inventario/productos/${id}/publicar`),
  descontinuarProducto: (id: number) => api.put(`/inventario/productos/${id}/descontinuar`),
  ajustarStock: (data: any) => api.post('/inventario/stock/ajustar', data),
  historialStock: (productoId: number) => api.get(`/inventario/stock/${productoId}/historial`),
  crearOrdenCompra: (data: any) => api.post('/inventario/ordenes-compra', data),
  recibirMercaderia: (data: any) => api.post('/inventario/recepciones', data),
  listarProveedores: () => api.get('/inventario/proveedores'),
  crearProveedor: (data: any) => api.post('/inventario/proveedores', data),
  actualizarProveedor: (id: number, data: any) => api.put(`/inventario/proveedores/${id}`, data),
  eliminarProveedor: (id: number) => api.delete(`/inventario/proveedores/${id}`),
};

// Funciones de API para productos
export const productosApi = {
  getProductos: (params?: any) => api.get('/productos', { params }),
  getProducto: (id: number) => api.get(`/productos/${id}`),
  getProductosConStock: (productoIds: number[]) =>
    api.post('/productos/stock-info', { productoIds }),
};