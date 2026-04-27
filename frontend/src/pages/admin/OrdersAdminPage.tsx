// frontend/src/pages/admin/OrdersAdminPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export const OrdersAdminPage = () => {
  const queryClient = useQueryClient();

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['admin-ordenes'],
    queryFn: async () => {
      // Nota: Asumimos que creamos un endpoint GET /api/v1/ordenes (admin) en el backend que lista TODAS las órdenes
      const { data } = await api.get('/ordenes/admin');
      return data.data;
    }
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, nuevoEstadoId, comentario }: { id: number, nuevoEstadoId: number, comentario: string }) =>
      api.put(`/ordenes/${id}/estado`, { nuevoEstadoId, comentario }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-ordenes'] });
    }
  });

  const getEstadoColor = (estado: string) => {
    if (estado === 'pagada') return 'bg-green-100 text-green-800';
    if (estado === 'en_proceso') return 'bg-blue-100 text-blue-800';
    if (estado === 'cancelada') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
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
                <tr key={o.id} className="border-b">
                  <td className="px-6 py-4 font-medium">{o.codigoOrden}</td>
                  <td className="px-6 py-4">{o.cliente?.razonSocial || 'N/A'}</td>
                  <td className="px-6 py-4">S/ {parseFloat(o.total).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(o.estado.nombre)}`}>
                      {o.estado.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {o.estado.nombre === 'pendiente_pago' && (
                      <Button size="sm" onClick={() => changeStatus.mutate({ id: o.id, nuevoEstadoId: 2, comentario: 'Pago validado manualmente' })}>
                        Marcar Pagada
                      </Button>
                    )}
                    {o.estado.nombre === 'pagada' && (
                      <Button size="sm" variant="secondary" onClick={() => changeStatus.mutate({ id: o.id, nuevoEstadoId: 3, comentario: 'Enviado a logística' })}>
                        Enviar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};