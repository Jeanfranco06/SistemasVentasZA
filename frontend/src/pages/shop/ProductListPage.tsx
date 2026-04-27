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

  const total = itemsCarrito.reduce((acc, item) => acc + (Number(item.precio) || 0) * item.cantidad, 0);
  const f = (num: number) => `S/ ${num.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden bg-slate-950 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_20%)]" />
        <div className="relative container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Catálogo empresarial</span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Compra tecnología profesional con precios claros y entrega confiable.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Descubre nuestra selección de productos para tu empresa con filtros inteligentes, stock verificado y un proceso de compra rápido y seguro.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => document.getElementById('product-list')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-slate-950 hover:bg-slate-100"
                >
                  Ver catálogo
                </Button>
                <Button variant="outline" onClick={limpiarFiltros}>Limpiar filtros</Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.25)] backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-200">Ventas</p>
                <p className="mt-4 text-3xl font-semibold">Pago seguro</p>
                <p className="mt-2 text-sm text-slate-300">Procesa tus compras con PayPal o tarjeta con un flujo seguro y optimizado.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.25)] backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-200">Inventario</p>
                <p className="mt-4 text-3xl font-semibold">Stock verificado</p>
                <p className="mt-2 text-sm text-slate-300">Solo mostramos productos con stock disponible y cantidades actualizadas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12" id="product-list">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Catálogo</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Catálogo de productos</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Filtra, ordena y encuentra la mejor tecnología disponible para tu operación.</p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                Mostrando {data?.data?.length || 0} de {data?.total || 0}
              </div>
            </div>

            <ProductFilters 
              busqueda={busqueda} setBusqueda={(val) => { setBusqueda(val); setPagina(1); }}
              categoriaId={categoriaId} setCategoriaId={(val) => { setCategoriaId(val); setPagina(1); }}
              ordenamiento={ordenamiento} setOrdenamiento={(val) => { setOrdenamiento(val); setPagina(1); }}
              categorias={categorias || []}
              onLimpiar={limpiarFiltros}
            />

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:flex-row">
                    <Button variant="outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
                    <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-800">Página {pagina} de {Math.ceil((data?.total || 0) / 12)}</span>
                    <Button variant="outline" disabled={pagina >= Math.ceil((data?.total || 0) / 12)} onClick={() => setPagina(p => p + 1)}>Siguiente</Button>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tu carrito</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">Resumen rápido</h3>
              <p className="mt-2 text-sm text-slate-600">Revisa los productos añadidos y el total estimado. Continúa la compra con confianza.</p>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Productos en carrito</span>
                  <span className="font-semibold">{itemsCarrito.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total estimado</span>
                  <span className="font-semibold">{f(total)}</span>
                </div>
                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">¡Listo para pagar!</p>
                  <p className="mt-1">Avanza al checkout para completar tu compra.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Beneficios</p>
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p>Precios transparentes y cálculo exacto de IGV.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p>Proceso de compra seguro con PayPal.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p>Actualización de stock en tiempo real.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ProductDetailModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        producto={productoSeleccionado} 
      />
    </div>
  );
}