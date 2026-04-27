import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { ProductFilters } from '@/components/shop/ProductFilters';
import { ProductDetailModal } from '@/components/shop/ProductDetailModal';
import { ProductoCard } from '@/components/shop/ProductCard';

export const ProductListPage = () => {
  // Estados de Filtros
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState('todas');
  const [ordenamiento, setOrdenamiento] = useState('relevancia');
  
  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  // Stores
  const agregarItem = useCartStore(state => state.agregarItem);
  const accessToken = useAuthStore(state => state.accessToken);
  
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

  // Queries
  const { data: categorias } = useQuery({
    queryKey: ['categorias-publicas'],
    queryFn: async () => { const { data } = await api.get('/categorias'); return data.data; }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['productos-tienda', pagina, busqueda, categoriaId, ordenamiento],
    queryFn: async () => {
      const params: any = { pagina, limite: 12 };
      if (busqueda) params.busqueda = busqueda;
      if (categoriaId !== 'todas') params.categoriaId = categoriaId;
      if (ordenamiento !== 'relevancia') params.orden = ordenamiento;
      
      const { data } = await api.get('/productos/tienda', { params });
      return data.data;
    }
  });

  // QUERY DE DESEOS (Solo se ejecuta si hay sesión)
  const { data: datosDeseos } = useQuery({
    queryKey: ['deseos-ids'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/deseos');
      return data.data;
    },
    enabled: !!accessToken // Clave para no ejecutar si es invitado
  });

  // Crear array plano de IDs: [1, 5, 12]
  const idsDeseados = useMemo(() => {
    if (!datosDeseos || !Array.isArray(datosDeseos)) return [];
    return datosDeseos.map((item: any) => item.productoId);
  }, [datosDeseos]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaId('todas');
    setOrdenamiento('relevancia');
    setPagina(1);
  };

  const handleVerDetalle = (producto: any) => {
    setProductoSeleccionado(producto);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Catálogo de Productos</h1>
        <p className="text-gray-500 mt-1">Encuentra todo lo que necesitas para tu negocio</p>
      </div>

      <ProductFilters 
        busqueda={busqueda} setBusqueda={(val) => { setBusqueda(val); setPagina(1); }}
        categoriaId={categoriaId} setCategoriaId={(val) => { setCategoriaId(val); setPagina(1); }}
        ordenamiento={ordenamiento} setOrdenamiento={(val) => { setOrdenamiento(val); setPagina(1); }}
        categorias={categorias || []}
        onLimpiar={limpiarFiltros}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-500">
            Mostrando {data?.data?.length || 0} de {data?.total || 0} productos
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.data?.map((producto: any) => (
              <ProductoCard 
                key={producto.id} 
                producto={producto} 
                onVerDetalle={handleVerDetalle}
                cantidadEnCarrito={cantidadesMap[producto.id] || 0}
                onAgregar={agregarItem}
                esDeseo={idsDeseados.includes(producto.id)}
              />
            ))}
          </div>

          {data?.total > 12 && (
            <div className="flex justify-center items-center gap-2 mt-10 pb-10">
              <Button variant="outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
              <span className="px-4 py-2 bg-gray-100 rounded-md font-medium text-sm">Página {pagina} de {Math.ceil((data?.total || 0) / 12)}</span>
              <Button variant="outline" disabled={pagina >= Math.ceil((data?.total || 0) / 12)} onClick={() => setPagina(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      )}

      <ProductDetailModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        producto={productoSeleccionado} 
      />
    </div>
  );
}