// frontend/src/pages/sales/SalesOrdersPage.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ventasApi } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';

interface Orden {
  id: number;
  codigoOrden: string;
  total: number;
  fechaCreacion: string;
  estado: {
    nombre: string;
  };
  cliente: {
    razonSocial: string;
    usuario: {
      email: string;
    };
  };
  items: Array<{
    cantidad: number;
  }>;
}

const estadoConfig: Record<string, {label: string; color: string}> = {
  pendiente_pago: { label: 'Pendiente Pago', color: 'bg-yellow-100 text-yellow-800' },
  pagada: { label: 'Pagada', color: 'bg-blue-100 text-blue-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-purple-100 text-purple-800' },
  enviada: { label: 'Enviada', color: 'bg-indigo-100 text-indigo-800' },
  entregada: { label: 'Entregada', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};

const transiciones: Record<string, string[]> = {
  pendiente_pago: ['pagada'],
  pagada: ['en_proceso', 'cancelada'],
  en_proceso: ['enviada', 'cancelada'],
  enviada: ['entregada'],
  entregada: [],
  cancelada: [],
};

export const SalesOrdersPage = () => {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('');
  const [changingOrderId, setChangingOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadOrdenes();
  }, [estado]);

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      const params = estado ? { estado } : {};
      const response = await ventasApi.listarOrdenesVentas(params);
      setOrdenes(response.data.data.ordenes || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar las órdenes');
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      setChangingOrderId(ordenId);
      await ventasApi.cambiarEstadoOrden(ordenId, { nuevoEstado });
      toast.success('Estado actualizado');
      await loadOrdenes();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setChangingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Venta</h1>
        <p className="text-gray-600 mt-2">Gestiona el estado de las órdenes de tus clientes</p>
      </div>

      {/* Filtro y Actualizar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filtrar por Estado
              </label>
              <Select value={estado || 'todos'} onValueChange={(value) => setEstado(value === 'todos' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente_pago">Pendiente Pago</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="entregada">Entregada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadOrdenes} variant="outline" disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Órdenes */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Cargando órdenes...</div>
      ) : ordenes.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay órdenes disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordenes.map((orden) => {
            const config = estadoConfig[orden.estado.nombre] || { label: orden.estado.nombre, color: 'bg-gray-100 text-gray-800' };
            const estadosDisponibles = transiciones[orden.estado.nombre] || [];

            return (
              <Card key={orden.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Información Básica */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        #{orden.codigoOrden}
                      </h3>
                      <p className="text-sm text-gray-600">{orden.cliente.razonSocial}</p>
                      <p className="text-xs text-gray-500">{orden.cliente.usuario.email}</p>
                    </div>

                    {/* Cantidad y Fecha */}
                    <div>
                      <p className="text-sm text-gray-600">
                        {orden.items.length} producto(s)
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(orden.fechaCreacion).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Total */}
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        S/ {Number(orden.total).toFixed(2)}
                      </p>
                    </div>

                    {/* Estado Actual */}
                    <div>
                      <Badge className={config.color}>
                        {config.label}
                      </Badge>
                    </div>

                    {/* Acciones - Cambiar Estado */}
                    <div>
                      {estadosDisponibles.length > 0 ? (
                        <Select 
                          onValueChange={(value) => handleCambiarEstado(orden.id, value)}
                          disabled={changingOrderId === orden.id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Cambiar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {estadosDisponibles.map((est) => (
                              <SelectItem key={est} value={est}>
                                {estadoConfig[est]?.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-500">Sin cambios disponibles</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};