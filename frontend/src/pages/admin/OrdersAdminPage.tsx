// frontend/src/pages/admin/OrdersAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { 
  ClipboardList, 
  ShoppingBag, 
  DollarSign, 
  Truck, 
  Calendar, 
  User, 
  Mail, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  MapPin, 
  CreditCard, 
  X, 
  Loader2 
} from 'lucide-react';

interface OrdenItem {
  id: number;
  productoNombre: string;
  sku: string;
  cantidad: number;
  precioUnitario: number | string;
  subtotal: number | string;
}

interface OrdenDireccionEnvio {
  id: number;
  alias?: string;
  direccion: string;
  ciudad?: string;
  destinatarioNombre?: string;
}

interface OrdenPago {
  id: number;
  metodo: string;
  estado: string;
  transacciones: Array<{
    id: number;
    estado: string;
    monto: number | string;
  }>;
}

interface OrdenHistorial {
  id: number;
  fechaCreacion: string;
  comentario?: string;
  estado: {
    nombre: string;
  };
  creadoPorUser?: {
    email: string;
    nombreCompleto: string;
  };
}

interface Orden {
  id: number;
  codigoOrden: string;
  cliente?: {
    razonSocial?: string;
    usuario?: {
      email: string;
      nombreCompleto: string;
    };
  };
  total: number | string;
  subtotal: number | string;
  impuestoIgv: number | string;
  costoEnvio: number | string;
  estado: {
    nombre: string;
  };
  items: OrdenItem[];
  direccionesEnvio: OrdenDireccionEnvio[];
  metodoEnvio?: {
    nombre: string;
  };
  pagos: OrdenPago[];
  historial: OrdenHistorial[];
  fechaCreacion: string;
}

export const OrdersAdminPage = () => {
  const queryClient = useQueryClient();
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  // 1. Obtener órdenes
  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['admin-ordenes'],
    queryFn: async () => {
      const { data } = await api.get('/ordenes/admin');
      return data.data;
    }
  });

  // 2. Obtener detalles de orden activa
  const { data: ordenDetalle, isLoading: isLoadingDetalle } = useQuery({
    queryKey: ['orden-detalle', selectedOrden?.id],
    queryFn: async () => {
      if (!selectedOrden?.id) return null;
      const { data } = await api.get(`/ordenes/${selectedOrden.id}`);
      return data.data as Orden;
    },
    enabled: !!selectedOrden?.id,
    staleTime: 0,
  });

  // 3. Cambiar estado de orden
  const changeStatus = useMutation({
    mutationFn: ({ id, nuevoEstadoId, comentario }: { id: number, nuevoEstadoId: number, comentario: string }) =>
      api.put(`/ordenes/${id}/estado`, { nuevoEstadoId, comentario }),
    onSuccess: () => {
      toast.success('Estado actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-ordenes'] });
      if (selectedOrden) {
        queryClient.invalidateQueries({ queryKey: ['orden-detalle'] });
      }
    },
    onError: () => {
      toast.error('Error al actualizar el estado logístico');
    }
  });

  const getEstadoColor = (estado: string) => {
    if (estado === 'pagada') return 'bg-emerald-50 text-emerald-700 border-emerald-250';
    if (estado === 'en_proceso') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (estado === 'enviada') return 'bg-purple-50 text-purple-750 border-purple-200';
    if (estado === 'entregada') return 'bg-teal-50 text-teal-700 border-teal-200';
    if (estado === 'cancelada') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (estado === 'pendiente_pago') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const displayOrden = ordenDetalle || selectedOrden;

  const formatCurrency = (value: number | string) => {
    return `S/ ${Number(value).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 w-full mx-auto p-4 md:p-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Centro de Pedidos</h1>
          </div>
          <p className="text-indigo-100/90 text-sm max-w-xl">
            Gestiona la logística y los estados de pago de todas las órdenes de compra. Aprueba transacciones y despacha envíos comerciales.
          </p>
        </div>
      </div>

      {/* Vista de Tarjetas para Móviles */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Cargando flujo de pedidos...</span>
            </div>
          </div>
        ) : ordenes?.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
              <span className="text-sm font-medium">No se han registrado órdenes comerciales aún</span>
            </div>
          </div>
        ) : (
          ordenes?.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((o: any) => (
            <div key={o.id} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-bold text-slate-800">{o.codigoOrden}</span>
                  <span className="text-xs text-slate-500 font-medium">{o.cliente?.razonSocial || 'Consumidor Final'}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(o.estado.nombre)}`}>
                  {o.estado.nombre.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Total:</span>
                  <span className="font-bold text-slate-900 ml-1">{formatCurrency(o.total)}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedOrden(o)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm hover:shadow text-xs"
                >
                  Ver Detalles
                </Button>
                {o.estado.nombre === 'pendiente_pago' && (
                  <Button 
                    size="sm" 
                    onClick={() => changeStatus.mutate({ 
                      id: o.id, 
                      nuevoEstadoId: 2, 
                      comentario: 'Pago validado de forma manual por el administrador' 
                    })}
                    disabled={changeStatus.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow font-medium text-xs"
                  >
                    Marcar Pagada
                  </Button>
                )}
                {o.estado.nombre === 'pagada' && (
                  <Button 
                    size="sm" 
                    onClick={() => changeStatus.mutate({ 
                      id: o.id, 
                      nuevoEstadoId: 3, 
                      comentario: 'Orden enviada a logística para despacho comercial' 
                    })}
                    disabled={changeStatus.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium text-xs"
                  >
                    Preparar
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla de Datos (Visible solo en Desktop) */}
      <div className="hidden md:block bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Código</th>
                <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Cliente</th>
                <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Total</th>
                <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Estado</th>
                <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium">Cargando flujo de pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : ordenes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="h-10 w-10 text-slate-300" />
                      <span className="text-sm font-medium">No se han registrado órdenes comerciales aún</span>
                    </div>
                  </td>
                </tr>
              ) : (
                ordenes?.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors duration-200">
                    <td className="px-6 py-6 font-mono text-sm font-bold text-slate-800 align-middle">
                      {o.codigoOrden}
                    </td>
                    <td className="px-6 py-6 font-semibold text-slate-700 align-middle">
                      {o.cliente?.razonSocial || 'Consumidor Final'}
                    </td>
                    <td className="px-6 py-6 font-bold text-slate-900 align-middle">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="px-6 py-6 align-middle">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(o.estado.nombre)}`}>
                        {o.estado.nombre.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-6 align-middle">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedOrden(o)}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm hover:shadow"
                        >
                          Ver Detalles
                        </Button>
                        {o.estado.nombre === 'pendiente_pago' && (
                          <Button 
                            size="sm" 
                            onClick={() => changeStatus.mutate({ 
                              id: o.id, 
                              nuevoEstadoId: 2, 
                              comentario: 'Pago validado de forma manual por el administrador' 
                            })}
                            disabled={changeStatus.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow font-medium"
                          >
                            Marcar Pagada
                          </Button>
                        )}
                        {o.estado.nombre === 'pagada' && (
                          <Button 
                            size="sm" 
                            onClick={() => changeStatus.mutate({ 
                              id: o.id, 
                              nuevoEstadoId: 3, 
                              comentario: 'Orden enviada a logística para despacho comercial' 
                            })}
                            disabled={changeStatus.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium"
                          >
                            Preparar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-slate-100 shadow-md rounded-2xl p-4 mt-4">
        <div className="text-sm text-slate-500 font-medium">
          Mostrando página <span className="text-slate-800">{currentPage + 1}</span> de <span className="text-slate-800">{Math.ceil((ordenes?.length || 0) / pageSize)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil((ordenes?.length || 0) / pageSize) - 1, prev + 1))}
            disabled={currentPage >= Math.ceil((ordenes?.length || 0) / pageSize) - 1}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Modal de Detalles de Orden */}
      {selectedOrden && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-scaleUp">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                    {displayOrden?.codigoOrden}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${displayOrden ? getEstadoColor(displayOrden.estado.nombre) : ''}`}>
                    {displayOrden?.estado.nombre.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Registrada el {displayOrden ? new Date(displayOrden.fechaCreacion).toLocaleString() : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!displayOrden) return;
                    try {
                      toast.loading('Generando comprobante oficial...', { id: 'pdf-dl' });
                      const token = useAuthStore.getState().accessToken;
                      const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
                      
                      const response = await fetch(`${apiUrl}/ordenes/${displayOrden.id}/pdf`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });
                      
                      if (!response.ok) throw new Error('Error en descarga');
                      
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `comprobante-${displayOrden.codigoOrden}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      toast.dismiss('pdf-dl');
                      toast.success('Documento descargado exitosamente');
                    } catch (error) {
                      toast.dismiss('pdf-dl');
                      toast.error('Error al generar el archivo de impresión');
                    }
                  }}
                  className="rounded-lg border-slate-200 font-medium flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>Imprimir PDF</span>
                </Button>
                <button 
                  onClick={() => {
                    setSelectedOrden(null);
                    queryClient.removeQueries({ queryKey: ['orden-detalle'] });
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isLoadingDetalle && !displayOrden ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-500">Cargando desglose de la orden...</span>
                </div>
              ) : displayOrden ? (
                <div className="space-y-6">
                  {/* Desglose en Columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Tarjeta de Cliente */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 space-y-3 shadow-sm">
                      <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <User className="h-4.5 w-4.5 text-blue-500" />
                        <span>Información del Cliente</span>
                      </h3>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-semibold">Razón Social:</strong> {displayOrden.cliente?.razonSocial || 'Consumidor Final'}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-semibold">Correo de Cuenta:</strong> {displayOrden.cliente?.usuario?.email || 'N/A'}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-semibold">Registrado por:</strong> {displayOrden.cliente?.usuario?.nombreCompleto || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Tarjeta de Envío */}
                    {displayOrden.direccionesEnvio?.length > 0 && (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 space-y-3 shadow-sm">
                        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                          <MapPin className="h-4.5 w-4.5 text-emerald-500" />
                          <span>Información de Envío y Despacho</span>
                        </h3>
                        <div className="space-y-1.5 text-sm">
                          <p className="text-slate-600">
                            <strong className="text-slate-800 font-semibold">Destinatario:</strong> {displayOrden.direccionesEnvio[0].destinatarioNombre || 'N/A'}
                          </p>
                          <p className="text-slate-600">
                            <strong className="text-slate-800 font-semibold">Dirección Física:</strong> {displayOrden.direccionesEnvio[0].direccion}
                          </p>
                          <p className="text-slate-600">
                            <strong className="text-slate-800 font-semibold">Ciudad:</strong> {displayOrden.direccionesEnvio[0].ciudad || 'N/A'}
                          </p>
                          {displayOrden.metodoEnvio && (
                            <p className="text-slate-600">
                              <strong className="text-slate-800 font-semibold">Método Transportista:</strong> {displayOrden.metodoEnvio.nombre}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabla de Productos de la Orden */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <ShoppingBag className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Items Solicitados</span>
                    </h3>
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm border-collapse text-left">
                          <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Producto</th>
                              <th className="px-4 py-3 font-semibold">SKU</th>
                              <th className="px-4 py-3 font-semibold text-center">Cantidad</th>
                              <th className="px-4 py-3 font-semibold text-right">Unitario</th>
                              <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-700">
                            {displayOrden.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-3 font-semibold text-slate-800">{item.productoNombre}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-900">{item.cantidad}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.precioUnitario)}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Financiero y Pagos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Totales */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-3.5 shadow-sm">
                      <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <CreditCard className="h-4.5 w-4.5 text-blue-500" />
                        <span>Desglose Comercial</span>
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Subtotal Base</span>
                          <span className="text-slate-700 font-semibold">{formatCurrency(displayOrden.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">IGV Oficial (18%)</span>
                          <span className="text-slate-700 font-semibold">{formatCurrency(displayOrden.impuestoIgv)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Costo de Logística / Envío</span>
                          <span className="text-slate-700 font-semibold">{formatCurrency(displayOrden.costoEnvio)}</span>
                        </div>
                        <div className="flex justify-between pt-2.5 border-t border-slate-200 text-slate-900 font-bold text-base">
                          <span>Monto Total Cobrado</span>
                          <span className="text-indigo-650 bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100/50">{formatCurrency(displayOrden.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Información de Transacción / Pago */}
                    {displayOrden.pagos?.length > 0 && (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm">
                        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                          <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                          <span>Información y Conciliación de Pago</span>
                        </h3>
                        {displayOrden.pagos.map((pago) => (
                          <div key={pago.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Pasarela / Método</span>
                              <span className="text-slate-800 font-bold uppercase">{pago.metodo}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Estado de Transacción</span>
                              <span className={`px-2 py-0.5 rounded-full text-xxs font-extrabold border uppercase ${pago.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {pago.estado}
                              </span>
                            </div>
                            {pago.transacciones?.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                <p className="text-slate-400 text-xxs font-bold uppercase tracking-wider">Historial de Transacciones Pasarela</p>
                                {pago.transacciones.map((trans) => (
                                  <div key={trans.id} className="flex justify-between text-xs text-slate-600 bg-white/70 border border-slate-100 rounded-lg p-2 shadow-xxs">
                                    <span className="font-medium">Ticket ID #{trans.id}</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(trans.monto)} ({trans.estado})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Línea de Tiempo (Timeline) Cronológica Vertical */}
                  {displayOrden.historial?.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Clock className="h-4.5 w-4.5 text-blue-500" />
                        <span>Historial de Estados (Auditoría Logística)</span>
                      </h3>
                      <div className="relative pl-6 border-l border-slate-200 ml-3 space-y-6 pt-2">
                        {displayOrden.historial.map((h, index) => {
                          const esUltimo = index === 0;
                          let dotColorClass = 'bg-slate-300 ring-slate-100';
                          if (h.estado.nombre === 'pagada') dotColorClass = 'bg-emerald-500 ring-emerald-100';
                          else if (h.estado.nombre === 'en_proceso') dotColorClass = 'bg-blue-500 ring-blue-100';
                          else if (h.estado.nombre === 'enviada') dotColorClass = 'bg-purple-500 ring-purple-100';
                          else if (h.estado.nombre === 'entregada') dotColorClass = 'bg-teal-500 ring-teal-100';
                          else if (h.estado.nombre === 'cancelada') dotColorClass = 'bg-rose-500 ring-rose-100';
                          else if (h.estado.nombre === 'pendiente_pago') dotColorClass = 'bg-amber-500 ring-amber-100';

                          return (
                            <div key={h.id} className="relative group">
                              {/* Punto de la línea de tiempo */}
                              <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ${dotColorClass} transition-all duration-300 group-hover:scale-110`} />

                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow transition-all duration-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border self-start ${getEstadoColor(h.estado.nombre)}`}>
                                    {h.estado.nombre.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-slate-400 font-medium">
                                    {new Date(h.fechaCreacion).toLocaleString()}
                                  </span>
                                </div>
                                {h.comentario && (
                                  <p className="text-slate-600 text-sm mt-2 pl-1 italic font-medium">
                                    "{h.comentario}"
                                  </p>
                                )}
                                {h.creadoPorUser && (
                                  <p className="text-slate-400 text-xxs mt-2 pl-1 font-semibold tracking-wide uppercase">
                                    Registrado por: {h.creadoPorUser.nombreCompleto || h.creadoPorUser.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Acciones de Cambio de Estado en Detalles */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                      <Truck className="h-4.5 w-4.5 text-blue-500" />
                      <span>Transición Logística de Estado</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayOrden.estado.nombre === 'pendiente_pago' && (
                        <Button 
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 2, 
                            comentario: 'Pago conciliado comercialmente desde la ventana de auditoría' 
                          })}
                          disabled={changeStatus.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow font-semibold"
                        >
                          Aprobar y Registrar Pago
                        </Button>
                      )}
                      {displayOrden.estado.nombre === 'pagada' && (
                        <Button 
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 3, 
                            comentario: 'Pedido transferido al área de preparación de empaques' 
                          })}
                          disabled={changeStatus.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow font-semibold"
                        >
                          Enviar a Preparación (Logística)
                        </Button>
                      )}
                      {displayOrden.estado.nombre === 'en_proceso' && (
                        <Button 
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 4, 
                            comentario: 'Pedido despachado oficialmente con el transportista asignado' 
                          })}
                          disabled={changeStatus.isPending}
                          className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl shadow font-semibold"
                        >
                          Marcar como Enviado / En Camino
                        </Button>
                      )}
                      {displayOrden.estado.nombre === 'enviada' && (
                        <Button 
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 5, 
                            comentario: 'Entrega final confirmada con conformidad del destinatario' 
                          })}
                          disabled={changeStatus.isPending}
                          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow font-semibold"
                        >
                          Confirmar Entrega / Completado
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};