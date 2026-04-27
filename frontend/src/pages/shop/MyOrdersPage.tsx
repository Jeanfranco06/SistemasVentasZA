import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  // Función para descargar PDF de la orden
  const handleDescargarPDF = async (ordenId: number, codigoOrden: string) => {
    try {
      const response = await api.get(`/clientes/ordenes/${ordenId}/pdf`, {
        responseType: 'blob'
      });
      
      // Crear URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orden_${codigoOrden}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF descargado correctamente');
    } catch (error: any) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Mis Órdenes</h1>
          <p className="mt-2 text-sm text-slate-500">Revisa el historial de tus compras y descarga tus comprobantes.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(index => (
              <div key={index} className="h-40 rounded-[32px] bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : ordenes?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              No has realizado compras aún.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {ordenes.map((orden: any) => (
              <Card key={orden.id} className="overflow-hidden">
                <CardHeader className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg text-blue-600">{orden.codigoOrden}</CardTitle>
                    <p className="text-sm text-slate-500">{new Date(orden.fechaCreacion).toLocaleDateString('es-PE')}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Badge className={`${getColorEstado(orden.estado.nombre)} text-sm px-3 py-1`}>
                      {orden.estado.nombre.replace('_', ' ')}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDescargarPDF(orden.id, orden.codigoOrden)}
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    {orden.items.map((item: any) => (
                      <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                        <div>
                          <span className="font-medium text-slate-900">{item.productoNombre}</span>
                          <span className="ml-2 text-slate-500">x{item.cantidad}</span>
                        </div>
                        <span className="font-semibold text-slate-900">S/ {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-end border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                      Total: S/ {Number(orden.total).toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};