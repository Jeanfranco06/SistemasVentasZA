// frontend/src/pages/admin/OrdersAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

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

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['admin-ordenes'],
    queryFn: async () => {
      const { data } = await api.get('/ordenes/admin');
      return data.data;
    }
  });

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

  const changeStatus = useMutation({
    mutationFn: ({ id, nuevoEstadoId, comentario }: { id: number, nuevoEstadoId: number, comentario: string }) =>
      api.put(`/ordenes/${id}/estado`, { nuevoEstadoId, comentario }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-ordenes'] });
      if (selectedOrden) {
        queryClient.invalidateQueries({ queryKey: ['orden-detalle'] });
      }
    }
  });

  const getEstadoColor = (estado: string) => {
    if (estado === 'pagada') return 'bg-green-100 text-green-800';
    if (estado === 'en_proceso') return 'bg-blue-100 text-blue-800';
    if (estado === 'cancelada') return 'bg-red-100 text-red-800';
    if (estado === 'pendiente_pago') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const displayOrden = ordenDetalle || selectedOrden;

  const formatCurrency = (value: number | string) => {
    return `S/ ${Number(value).toFixed(2)}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Órdenes</h1>
      {isLoading ? <div>Cargando...</div> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes?.map((o: any) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{o.codigoOrden}</td>
                  <td className="px-6 py-4">{o.cliente?.razonSocial || 'N/A'}</td>
                  <td className="px-6 py-4">{formatCurrency(o.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(o.estado.nombre)}`}>
                      {o.estado.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedOrden(o)}
                      >
                        Ver Detalles
                      </Button>
                      {o.estado.nombre === 'pendiente_pago' && (
                        <Button 
                          size="sm" 
                          onClick={() => changeStatus.mutate({ 
                            id: o.id, 
                            nuevoEstadoId: 2, 
                            comentario: 'Pago validado manualmente' 
                          })}
                        >
                          Marcar Pagada
                        </Button>
                      )}
                      {o.estado.nombre === 'pagada' && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => changeStatus.mutate({ 
                            id: o.id, 
                            nuevoEstadoId: 3, 
                            comentario: 'Enviado a logística' 
                          })}
                        >
                          Enviar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalles de Orden */}
      {selectedOrden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  Detalles de Orden - {displayOrden?.codigoOrden}
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        // Download PDF from backend with authentication
                        const token = useAuthStore.getState().accessToken;
                        const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
                        
                        const response = await fetch(`${apiUrl}/ordenes/${displayOrden?.id}/pdf`, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        
                        if (!response.ok) {
                          throw new Error('Error al generar PDF');
                        }
                        
                        // Get the PDF blob and download
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `orden-${displayOrden?.codigoOrden}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        toast.success('PDF descargado exitosamente');
                      } catch (error) {
                        console.error('Error al descargar PDF:', error);
                        toast.error('Error al generar el PDF');
                      }
                    }}
                  >
                    📄 Descargar PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedOrden(null);
                      queryClient.removeQueries({ queryKey: ['orden-detalle'] });
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              {isLoadingDetalle && !displayOrden ? (
                <div className="text-center py-8">Cargando detalles...</div>
              ) : displayOrden ? (
                <div className="space-y-6">
                  {/* Información General */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2">Información del Cliente</h3>
                      <p className="text-sm">
                        <strong>Nombre:</strong> {displayOrden.cliente?.razonSocial || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {displayOrden.cliente?.usuario?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2">Información de la Orden</h3>
                      <p className="text-sm">
                        <strong>Fecha:</strong> {new Date(displayOrden.fechaCreacion).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        <strong>Estado:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getEstadoColor(displayOrden.estado.nombre)}`}>
                          {displayOrden.estado.nombre}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Dirección de Envío */}
                  {displayOrden.direccionesEnvio?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2">Dirección de Envío</h3>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm">
                          <strong>Destinatario:</strong> {displayOrden.direccionesEnvio[0].destinatarioNombre || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <strong>Dirección:</strong> {displayOrden.direccionesEnvio[0].direccion}
                        </p>
                        <p className="text-sm">
                          <strong>Ciudad:</strong> {displayOrden.direccionesEnvio[0].ciudad || 'N/A'}
                        </p>
                        {displayOrden.metodoEnvio && (
                          <p className="text-sm">
                            <strong>Método de Envío:</strong> {displayOrden.metodoEnvio.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items de la Orden */}
                  <div>
                    <h3 className="font-semibold text-gray-600 mb-2">Productos</h3>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Producto</th>
                            <th className="px-4 py-2 text-left">SKU</th>
                            <th className="px-4 py-2 text-center">Cantidad</th>
                            <th className="px-4 py-2 text-right">Precio Unit.</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayOrden.items?.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2">{item.productoNombre}</td>
                              <td className="px-4 py-2">{item.sku}</td>
                              <td className="px-4 py-2 text-center">{item.cantidad}</td>
                              <td className="px-4 py-2 text-right">{formatCurrency(item.precioUnitario)}</td>
                              <td className="px-4 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold text-gray-600 mb-2">Resumen Financiero</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong>Subtotal:</strong> {formatCurrency(displayOrden.subtotal)}
                      </p>
                      <p className="text-sm">
                        <strong>IGV (18%):</strong> {formatCurrency(displayOrden.impuestoIgv)}
                      </p>
                      <p className="text-sm">
                        <strong>Costo de Envío:</strong> {formatCurrency(displayOrden.costoEnvio)}
                      </p>
                      <p className="text-sm font-bold text-lg">
                        <strong>Total:</strong> {formatCurrency(displayOrden.total)}
                      </p>
                    </div>
                  </div>

                  {/* Información de Pago */}
                  {displayOrden.pagos?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2">Información de Pago</h3>
                      {displayOrden.pagos.map((pago) => (
                        <div key={pago.id} className="bg-gray-50 p-4 rounded mb-2">
                          <p className="text-sm">
                            <strong>Método:</strong> {pago.metodo}
                          </p>
                          <p className="text-sm">
                            <strong>Estado:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${pago.estado === 'aprobado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {pago.estado}
                            </span>
                          </p>
                          {pago.transacciones?.length > 0 && (
                            <div className="mt-2 ml-4">
                              <p className="text-xs text-gray-500">Transacciones:</p>
                              {pago.transacciones.map((trans) => (
                                <p key={trans.id} className="text-sm">
                                  - Monto: {formatCurrency(trans.monto)} | Estado: {trans.estado}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Historial de Estados */}
                  {displayOrden.historial?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2">Historial de Estados</h3>
                      <div className="border rounded">
                        {displayOrden.historial.map((h, index) => (
                          <div 
                            key={h.id} 
                            className={`p-3 ${index !== displayOrden.historial.length - 1 ? 'border-b' : ''}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(h.estado.nombre)}`}>
                                {h.estado.nombre}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(h.fechaCreacion).toLocaleString()}
                              </span>
                            </div>
                            {h.comentario && (
                              <p className="text-sm mt-1 text-gray-600">
                                <strong>Comentario:</strong> {h.comentario}
                              </p>
                            )}
                            {h.creadoPorUser && (
                              <p className="text-xs text-gray-500">
                                Por: {h.creadoPorUser.nombreCompleto || h.creadoPorUser.email}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones de Cambio de Estado */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-600 mb-2">Cambiar Estado</h3>
                    <div className="flex gap-2 flex-wrap">
                      {displayOrden.estado.nombre === 'pendiente_pago' && (
                        <Button 
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 2, 
                            comentario: 'Pago validado manualmente desde detalles' 
                          })}
                        >
                          Marcar como Pagada
                        </Button>
                      )}
                      {displayOrden.estado.nombre === 'pagada' && (
                        <Button 
                          variant="secondary"
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 3, 
                            comentario: 'Enviado a logística desde detalles' 
                          })}
                        >
                          Enviar a Logística
                        </Button>
                      )}
                      {displayOrden.estado.nombre === 'en_proceso' && (
                        <Button 
                          onClick={() => changeStatus.mutate({ 
                            id: displayOrden.id, 
                            nuevoEstadoId: 4, 
                            comentario: 'Orden completada desde detalles' 
                          })}
                        >
                          Completar Orden
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