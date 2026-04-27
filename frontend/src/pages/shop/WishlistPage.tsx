import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useCartStore } from '@/stores/cart.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export const WishlistPage = () => {
  const queryClient = useQueryClient();
  const agregarItem = useCartStore(state => state.agregarItem);

  const { data: deseos, isLoading } = useQuery({
    queryKey: ['mis-deseos'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/deseos');
      return data.data;
    }
  });

  // Mutación optimizada para eliminar
  const eliminarMutation = useMutation({
    mutationFn: async (productoId: number) => {
      // Se envía EXACTAMENTE el mismo formato que el Card del catálogo
      const { data } = await api.post('/clientes/deseos', { productoId });
      return data;
    },
    onSuccess: (data) => {
      // Mostrar el mensaje que devuelve el backend ('Agregado' o 'Eliminado')
      toast.success(data.message);
      // Refrescar automáticamente la lista para que desaparezca la card sin recargar
      queryClient.invalidateQueries({ queryKey: ['mis-deseos'] });
      // Refrescar también los corazones del catálogo para que cambien de rojo a gris
      queryClient.invalidateQueries({ queryKey: ['deseos-ids'] });
    },
    onError: () => {
      toast.error('Error al actualizar favorito');
    }
  });

  const handleAgregarAlCarrito = (item: any) => {
    agregarItem({
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      sku: item.producto.sku,
      precio: Number(item.producto.precioVenta),
      cantidad: 1,
      stockDisponible: 999 
    });
    toast.success(`${item.producto.nombre} pasó al carrito`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Mi Lista de Deseos</h1>
      <p className="text-gray-500 mb-8">Productos que te gustaron y guardaste para más tarde.</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : deseos?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">💝</div>
            <p className="text-gray-500 font-medium">Tu lista de deseos está vacía</p>
            <p className="text-gray-400 text-sm mt-1">Explora el catálogo y haz clic en el ❤️ para guardar productos aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {deseos.map((item: any) => (
            <Card key={item.id} className="overflow-hidden group"> {/* SOLUCIÓN AL WARNING: key={item.id} */}
              <div className="bg-gray-50 h-48 flex items-center justify-center relative">
                <div className="text-5xl text-gray-300">🖼️</div>
                {/* Botón X */}
                <button 
                  onClick={() => eliminarMutation.mutate(item.producto.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">{item.producto.sku}</p>
                <h3 className="font-semibold text-sm line-clamp-2 mb-3">{item.producto.nombre}</h3>
                <div className="flex items-center justify-between mt-auto pt-3 border-t">
                  <span className="text-lg font-bold">S/ {Number(item.producto.precioVenta).toFixed(2)}</span>
                  <Button size="sm" onClick={() => handleAgregarAlCarrito(item)}>Al carrito</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};