// frontend/src/pages/shop/CartPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { productosApi } from '@/services/api';

export const CartPage = () => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const modificarCantidad = useCartStore(state => state.modificarCantidad);
  const eliminarItem = useCartStore(state => state.eliminarItem);

  // Estado local para manejar inputs temporales
  const [cantidadInputs, setCantidadInputs] = useState<Record<number, string>>({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Actualizar stock disponible al cargar la página
  useEffect(() => {
    const actualizarStockDisponible = async () => {
      if (items.length === 0) return;

      setIsLoadingStock(true);
      try {
        const productoIds = items.map(item => item.productoId);
        const response = await productosApi.getProductosConStock(productoIds);
        const stockInfo = response.data.data;

        // Actualizar el stock disponible en el store
        const updatedItems = items.map(item => {
          const stockData = stockInfo.find((s: any) => s.productoId === item.productoId);
          if (stockData) {
            return {
              ...item,
              stockDisponible: stockData.stockDisponible,
              precio: stockData.precioVenta // También actualizar precio por si cambió
            };
          }
          return item;
        });

        // Reemplazar items en el store con información actualizada
        updatedItems.forEach(item => {
          // Si la cantidad actual excede el stock disponible, ajustarla
          if (item.cantidad > item.stockDisponible) {
            modificarCantidad(item.productoId, item.stockDisponible);
            toast.error(`La cantidad de ${item.nombre} se ajustó al stock disponible (${item.stockDisponible})`);
          }
        });

      } catch (error) {
        console.error('Error al actualizar stock:', error);
        toast.error('Error al verificar stock disponible');
      } finally {
        setIsLoadingStock(false);
      }
    };

    actualizarStockDisponible();
  }, []); // Solo ejecutar al montar el componente

  // Cálculos de costos
  const subtotal = items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const costoEnvio = 15.00;
  const subtotalGravable = subtotal + costoEnvio;
  const igv = subtotalGravable * 0.18;
  const total = subtotalGravable + igv;

  const handleCambiarCantidad = (productoId: number, nuevaCantidad: number) => {
    const item = items.find(i => i.productoId === productoId);
    if (!item) return;

    if (nuevaCantidad <= 0) {
      eliminarItem(productoId);
      toast.success('Producto eliminado del carrito');
      return;
    }

    if (nuevaCantidad > item.stockDisponible) {
      toast.error(`Solo hay ${item.stockDisponible} unidades disponibles. Cantidad ajustada al máximo disponible.`);
      modificarCantidad(productoId, item.stockDisponible);
      return;
    }

    if (nuevaCantidad === item.stockDisponible && item.cantidad < item.stockDisponible) {
      toast('Has alcanzado el stock máximo disponible.', { icon: '✅' });
    }

    modificarCantidad(productoId, nuevaCantidad);
  };

  const handleCantidadInputChange = (productoId: number, value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    setCantidadInputs(prev => ({ ...prev, [productoId]: numericValue }));

    const numValue = parseInt(numericValue) || 0;
    if (numValue > 0) {
      const item = items.find(i => i.productoId === productoId);
      if (item && numValue >= item.stockDisponible) {
        if (numValue > item.stockDisponible) {
          toast.error(`Solo hay ${item.stockDisponible} unidades disponibles. Cantidad ajustada al máximo disponible.`);
          modificarCantidad(productoId, item.stockDisponible);
        } else if (item.cantidad < item.stockDisponible) {
          toast('Has alcanzado el stock máximo disponible.', { icon: '✅' });
          modificarCantidad(productoId, numValue);
        }
      } else {
        handleCambiarCantidad(productoId, numValue);
      }
    }
  };

  const handleCantidadInputBlur = (productoId: number) => {
    // Limpiar el input temporal cuando pierde el foco
    setCantidadInputs(prev => {
      const newState = { ...prev };
      delete newState[productoId];
      return newState;
    });
  };

  const handleEliminarProducto = (productoId: number, nombre: string) => {
    eliminarItem(productoId);
    toast.success(`${nombre} eliminado del carrito`);
  };

  // Formateador de moneda
  const f = (num: number) => `S/ ${num.toFixed(2)}`;

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-5xl">
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 shadow-sm">
          <div className="mb-6">
            <h1 className="text-4xl font-semibold text-slate-900">Tu carrito está vacío</h1>
            <p className="mt-2 text-slate-500">Aún no has agregado productos. Explora el catálogo y encuentra lo que necesitas.</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="text-6xl">🛒</div>
            <p className="text-slate-500 text-lg">Tu carrito no tiene artículos por el momento.</p>
            <Button onClick={() => navigate('/')} className="w-full sm:w-auto">
              Ir al Catálogo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Tu Carrito de Compras</h1>
            <p className="mt-2 text-sm text-slate-500">Revisa tus productos y finaliza tu compra cuando estés listo.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_0.95fr]">
        {/* Lista de Productos */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.productoId}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Imagen placeholder */}
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📦</span>
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-2">{item.nombre}</h3>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500">Precio unitario: {f(item.precio)}</p>
                    <p className="text-xs text-gray-400">Stock disponible: {item.stockDisponible} unidades</p>
                  </div>

                  {/* Controles de cantidad y precio */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Controles de cantidad */}
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => handleCambiarCantidad(item.productoId, item.cantidad - 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                      disabled={item.cantidad <= 1}
                    >
                      -
                    </button>
                    <Input
                      type="text"
                      value={cantidadInputs[item.productoId] ?? item.cantidad.toString()}
                      onChange={(e) => handleCantidadInputChange(item.productoId, e.target.value)}
                      onBlur={() => handleCantidadInputBlur(item.productoId)}
                      className="w-16 text-center border-0 focus:ring-0 px-2 py-1"
                      maxLength={3}
                    />
                    <button
                      onClick={() => handleCambiarCantidad(item.productoId, item.cantidad + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                      disabled={item.cantidad >= item.stockDisponible}
                    >
                      +
                    </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="font-semibold text-lg">{f(item.precio * item.cantidad)}</p>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEliminarProducto(item.productoId, item.nombre)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumen de Compra */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({items.length} productos)</span>
                  <span>{f(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>{f(costoEnvio)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>IGV (18%)</span>
                  <span>{f(igv)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{f(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate('/checkout')}
              >
                Proceder al Checkout
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Continuar Comprando
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};