import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MyOrdersPage = () => {
  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['mis-ordenes'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/ordenes');
      return data.data;
    }
  });

  const getColorEstado = (estado: string) => {
    if (estado === 'pendiente_pago') return 'bg-yellow-100 text-yellow-800';
    if (estado === 'pagada' || estado === 'en_proceso') return 'bg-blue-100 text-blue-800';
    if (estado === 'enviada' || estado === 'entregada') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mis Órdenes</h1>

      {isLoading ? <div>Cargando...</div> : ordenes?.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-gray-500">No has realizado compras aún.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {ordenes.map((orden: any) => (
            <Card key={orden.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg text-blue-600">{orden.codigoOrden}</CardTitle>
                  <p className="text-sm text-gray-500">{new Date(orden.fechaCreacion).toLocaleDateString('es-PE')}</p>
                </div>
                <Badge className={`${getColorEstado(orden.estado.nombre)} text-sm px-3 py-1`}>
                  {orden.estado.nombre.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 border-t pt-4">
                  {orden.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.productoNombre}</span>
                        <span className="text-gray-500 ml-2">x{item.cantidad}</span>
                      </div>
                      <span>S/ {Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-end border-t pt-2 mt-2 font-bold text-lg">
                    Total: S/ {Number(orden.total).toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};