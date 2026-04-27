import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { Card, CardContent } from '@/components/ui/card';
import { ProductoCard } from '@/components/shop/ProductCard';

export const WishlistPage = () => {
  const accessToken = useAuthStore(state => state.accessToken);
  const agregarItem = useCartStore(state => state.agregarItem);

  // SUSCRIPCIÓN REACTIVA (Carrito)
  const itemsCarrito = useCartStore(state => state.items);

  // Mapa rápido { productoId: cantidadEnCarrito }
  const cantidadesMap = useMemo(() => {
    const map: Record<number, number> = {};
    itemsCarrito.forEach(item => {
      map[item.productoId] = item.cantidad;
    });
    return map;
  }, [itemsCarrito]);

  const { data: deseos, isLoading } = useQuery({
    queryKey: ['mis-deseos'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/deseos');
      return data.data;
    }
  });

  const handleAgregarAlCarrito = (item: any) => {
    const stockDisponible = (item.producto.invStockProducto?.stockFisico || 0) - (item.producto.invStockProducto?.stockReservado || 0);
    agregarItem({
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      sku: item.producto.sku,
      precio: Number(item.producto.precioOferta || item.producto.precioVenta),
      cantidad: 1,
      stockDisponible 
    });
  };

  const handleVerDetalle = (producto: any) => {
    // Este manejador se puede expandir para mostrar un modal de detalle si es necesario
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Mi Lista de Deseos</h1>
        <p className="text-gray-500 mt-1">Productos que te guardaste para revisar más tarde</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-xl" />)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {deseos.map((deseado: any) => (
            <ProductoCard
              key={deseado.id}
              producto={deseado.producto}
              onVerDetalle={handleVerDetalle}
              cantidadEnCarrito={cantidadesMap[deseado.producto.id] || 0}
              onAgregar={handleAgregarAlCarrito}
              esDeseo={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};