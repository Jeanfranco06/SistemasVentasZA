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

  const handleAgregarAlCarrito = (itemData: any) => {
    agregarItem({
      productoId: itemData.productoId,
      nombre: itemData.nombre,
      sku: itemData.sku,
      precio: itemData.precio,
      cantidad: itemData.cantidad,
      stockDisponible: itemData.stockDisponible 
    });
  };

  const handleVerDetalle = (producto: any) => {
    // Este manejador se puede expandir para mostrar un modal de detalle si es necesario
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Mi Lista de Deseos</h1>
              <p className="mt-2 text-sm text-slate-500">Guarda productos para más tarde y regresa cuando estés listo para comprar.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {deseos?.length ?? 0} {deseos?.length === 1 ? 'deseo' : 'deseos'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-96 rounded-[28px] bg-slate-100 animate-pulse" />)}
          </div>
        ) : deseos?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">💝</div>
              <p className="text-slate-500 font-medium">Tu lista de deseos está vacía</p>
              <p className="text-slate-400 text-sm mt-1">Explora el catálogo y guarda aquí los productos que más te interesan.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </div>
  );
};