import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart.store';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PayPalCheckout } from '@/components/checkout/PayPalCheckout';
import { toast } from 'react-hot-toast';

type Paso = 'identificacion' | 'direccion' | 'envio' | 'pago' | 'revision';

const pasosConfig: { key: Paso; nombre: string }[] = [
  { key: 'identificacion', nombre: 'Identificación' },
  { key: 'direccion', nombre: 'Dirección' },
  { key: 'envio', nombre: 'Envío' },
  { key: 'pago', nombre: 'Pago' },
  { key: 'revision', nombre: 'Revisión' },
];

export const CheckoutWizardPage = () => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const limpiarCarrito = useCartStore(state => state.limpiarCarrito);
  
  // Cálculos de costos
  const subtotal = items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const costoEnvio = 15.00; // Costo estándar fijo por ahora
  const subtotalGravable = subtotal + costoEnvio;
  const igv = subtotalGravable * 0.18;
  const total = subtotalGravable + igv;
  
  const [pasoActual, setPasoActual] = useState<Paso>('identificacion');
  const pasoIndex = pasosConfig.findIndex(p => p.key === pasoActual);

  const [formData, setFormData] = useState({
    documento: '',
    direccion: '',
    ciudad: 'Lima',
    metodoPago: 'tarjeta'
  });
  const [ordenInternaId, setOrdenInternaId] = useState<number | null>(null);
  const [ordenCreada, setOrdenCreada] = useState(false);

  const checkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/ordenes/checkout', data, { timeout: 30000 });
      return response;
    },
    onSuccess: (res) => {
      const { codigoOrden } = res.data.data;
      toast.success(`¡Orden ${codigoOrden} creada con éxito!`);
      limpiarCarrito();
      navigate('/');
    },
    onError: (err: any) => {
      if (err.code === 'ECONNABORTED') {
        toast.error('El servidor tardó demasiado. Intente nuevamente.');
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message, { duration: 5000 });
      } else {
        toast.error('Ocurrió un error inesperado al procesar su orden.');
      }
    }
  });

  const crearOrdenPayPalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/ordenes/checkout', data, { timeout: 30000 });
      return response;
    },
    onSuccess: (res) => {
      const { ordenId, codigoOrden } = res.data.data;
      setOrdenInternaId(ordenId);
      setOrdenCreada(true);
      toast.success(`Orden ${codigoOrden} creada. Procede a pagar con PayPal.`);
    },
    onError: (err: any) => {
      if (err.code === 'ECONNABORTED') {
        toast.error('El servidor tardó demasiado. Intente nuevamente.');
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message, { duration: 5000 });
      } else {
        toast.error('Ocurrió un error al crear la orden de PayPal.');
      }
    }
  });

  const handleSiguiente = () => {
    if (pasoActual === 'direccion' && formData.direccion.trim().length < 5) {
      toast.error('Ingrese una dirección válida (mínimo 5 caracteres)');
      return;
    }
    const pasos = ['identificacion', 'direccion', 'envio', 'pago', 'revision'];
    const idxActual = pasos.indexOf(pasoActual);
    if (idxActual < pasos.length - 1) {
      setPasoActual(pasos[idxActual + 1] as Paso);
    }
  };

  const handleCrearOrdenPayPal = () => {
    if (items.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    const itemsLimpios = items.map(item => ({
      productoId: Number(item.productoId),
      cantidad: Number(item.cantidad),
      precio: Number(item.precio) || 0,
      nombre: item.nombre,
      sku: item.sku
    })).filter(item => !isNaN(item.productoId) && !isNaN(item.cantidad));

    if (itemsLimpios.length !== items.length) {
      toast.error('Hubo un error al leer los productos del carrito. Recargue la página.');
      return;
    }

    crearOrdenPayPalMutation.mutate({
      direccionEnvio: {
        direccion: formData.direccion,
        ciudad: formData.ciudad
      },
      metodoEnvioId: 1,
      metodoPago: 'paypal',
      items: itemsLimpios
    });
  };

  const handleAtras = () => {
    const pasos = ['identificacion', 'direccion', 'envio', 'pago', 'revision'];
    const idxActual = pasos.indexOf(pasoActual);
    if (idxActual > 0) {
      setPasoActual(pasos[idxActual - 1] as Paso);
    }
  };

  const handlePayPalSuccess = useCallback(() => {
    toast.success('Pago PayPal completado. Redirigiendo...');
    limpiarCarrito();
    navigate('/');
  }, [limpiarCarrito, navigate]);

  const handlePayPalError = useCallback(() => {
    toast.error('Error en la pasarela de PayPal. Intente nuevamente.');
  }, []);

  const handleConfirmar = () => {
    if (formData.metodoPago === 'paypal') {
      if (!ordenInternaId) {
        toast.error('Primero crea la orden PayPal en el paso de pago.');
        return;
      }
      toast('Ya creaste la orden PayPal. Completa el pago en el paso Pago.');
      setPasoActual('pago');
      return;
    }

    if (items.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    const itemsLimpios = items.map(item => ({
      productoId: Number(item.productoId),
      cantidad: Number(item.cantidad),
      precio: Number(item.precio) || 0,
      nombre: item.nombre,
      sku: item.sku
    })).filter(item => !isNaN(item.productoId) && !isNaN(item.cantidad));

    if (itemsLimpios.length !== items.length) {
      toast.error('Hubo un error al leer los productos del carrito. Recargue la página.');
      return;
    }

    checkoutMutation.mutate({
      direccionEnvio: {
        direccion: formData.direccion,
        ciudad: formData.ciudad
      },
      metodoEnvioId: 1,
      metodoPago: formData.metodoPago,
      items: itemsLimpios
    });
  };

  // Formateador de moneda
  const f = (num: number) => `S/ ${num.toFixed(2)}`;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Checkout</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Confirma tu pedido</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Revisa tu pedido, elige el método de pago y finaliza tu compra con seguridad.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              <p className="font-medium text-slate-900">Resumen rápido</p>
              <p>{items.length} {items.length === 1 ? 'producto' : 'productos'} · {f(total)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.75fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50">
              <CardTitle>Proceso de pago</CardTitle>
              <CardDescription>Completa cada paso para finalizar tu compra.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-5">
                  {pasosConfig.map((p, i) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => i <= pasoIndex && setPasoActual(p.key)}
                      className={`flex flex-col items-center rounded-2xl border p-3 text-center transition ${
                        pasoIndex === i
                          ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        pasoIndex === i ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-xs uppercase tracking-[0.16em]">{p.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={pasoActual !== 'identificacion' ? 'hidden' : 'space-y-4'}>
                <h2 className="text-xl font-semibold text-slate-900">Identificación</h2>
                <div className="grid gap-4">
                  <div>
                    <Label>DNI / RUC (Opcional para boleta)</Label>
                    <Input
                      value={formData.documento}
                      onChange={e => setFormData({ ...formData, documento: e.target.value })}
                      placeholder="Ej: 12345678"
                    />
                  </div>
                </div>
              </div>

              <div className={pasoActual !== 'direccion' ? 'hidden' : 'space-y-4'}>
                <h2 className="text-xl font-semibold text-slate-900">Dirección de Envío</h2>
                <div className="grid gap-4">
                  <div>
                    <Label>Dirección Completa <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.direccion}
                      onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Av. Principal 123, Dpto 402"
                    />
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <Input
                      value={formData.ciudad}
                      onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                      placeholder="Lima"
                    />
                  </div>
                </div>
              </div>

              <div className={pasoActual !== 'envio' ? 'hidden' : 'space-y-4'}>
                <h2 className="text-xl font-semibold text-slate-900">Método de Envío</h2>
                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">✓</div>
                    <div>
                      <p className="font-medium text-slate-900">Estándar (3-5 días hábiles)</p>
                      <p className="text-sm text-slate-500">Entrega a domicilio verificada</p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900">{f(costoEnvio)}</span>
                </label>
              </div>

              <div className={pasoActual !== 'pago' ? 'hidden' : 'space-y-4'}>
                <h2 className="text-xl font-semibold text-slate-900">Método de Pago</h2>

                <div className="grid gap-4">
                  <label className={`flex cursor-pointer items-center justify-between rounded-3xl border p-4 transition ${
                    formData.metodoPago === 'tarjeta'
                      ? 'border-blue-500 bg-blue-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="pago"
                        checked={formData.metodoPago === 'tarjeta'}
                        onChange={() => setFormData({ ...formData, metodoPago: 'tarjeta' })}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <div>
                        <p className="font-medium">Tarjeta de Crédito / Débito</p>
                        <p className="text-sm text-slate-500">Pago simulado con seguridad.</p>
                      </div>
                    </div>
                  </label>

                  <label className={`flex cursor-pointer items-center justify-between rounded-3xl border p-4 transition ${
                    formData.metodoPago === 'paypal'
                      ? 'border-blue-500 bg-blue-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="pago"
                        checked={formData.metodoPago === 'paypal'}
                        onChange={() => setFormData({ ...formData, metodoPago: 'paypal' })}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-slate-500">Paga de forma rápida y segura con tu cuenta PayPal.</p>
                      </div>
                    </div>
                  </label>
                </div>

                {formData.metodoPago === 'paypal' && (
                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    {!ordenInternaId ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700">
                          Primero se creará la orden en el sistema para continuar con el pago de PayPal.
                        </p>
                        <Button
                          onClick={handleCrearOrdenPayPal}
                          disabled={crearOrdenPayPalMutation.isPending || items.length === 0}
                        >
                          {crearOrdenPayPalMutation.isPending ? 'Creando orden...' : 'Iniciar pago con PayPal'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700">Orden interna creada. Completa el pago usando el botón de PayPal.</p>
                        <PayPalCheckout
                          ordenId={ordenInternaId}
                          monto={total}
                          onSuccess={handlePayPalSuccess}
                          onError={handlePayPalError}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={pasoActual !== 'revision' ? 'hidden' : 'space-y-6'}>
                <h2 className="text-xl font-semibold text-slate-900">Revisión de Compra</h2>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <p className="text-sm font-semibold text-slate-900">Productos ({items.length})</p>
                    <button
                      onClick={() => navigate('/carrito')}
                      className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                    >
                      Modificar
                    </button>
                  </div>
                  <div className="space-y-3 py-4 max-h-64 overflow-y-auto">
                    {items.map(i => (
                      <div key={i.productoId} className="flex items-start justify-between gap-4 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{i.nombre}</p>
                          <p className="text-slate-500">SKU: {i.sku} · Cant: {i.cantidad}</p>
                        </div>
                        <span className="whitespace-nowrap font-semibold text-slate-900">{f(i.precio * i.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Datos de envío</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p><span className="font-medium">Dirección:</span> {formData.direccion || 'No especificada'}</p>
                      <p><span className="font-medium">Ciudad:</span> {formData.ciudad}</p>
                      {formData.documento && (
                        <p><span className="font-medium">Documento:</span> {formData.documento}</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resumen de pago</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <span>Subtotal productos</span>
                        <span>{f(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Envío estándar</span>
                        <span>{f(costoEnvio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base imponible</span>
                        <span>{f(subtotalGravable)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IGV (18%)</span>
                        <span>{f(igv)}</span>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">
                      <div className="flex justify-between">
                        <span>Total a pagar</span>
                        <span>{f(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {pasoActual !== 'identificacion' ? (
                <Button variant="outline" onClick={handleAtras}>Atrás</Button>
              ) : (
                <div />
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {pasoActual !== 'revision' ? (
                  <Button onClick={handleSiguiente}>{pasoActual === 'envio' ? 'Continuar al pago' : 'Siguiente'}</Button>
                ) : formData.metodoPago === 'paypal' ? (
                  <Button
                    variant="secondary"
                    onClick={() => setPasoActual('pago')}
                    className="min-w-[180px]"
                  >
                    Ir a Pago con PayPal
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirmar}
                    disabled={checkoutMutation.isPending || items.length === 0}
                    className="min-w-[180px]"
                  >
                    {checkoutMutation.isPending ? 'Procesando compra...' : 'Confirmar y pagar'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50">
              <CardTitle>Detalle del pedido</CardTitle>
              <CardDescription>Información clave para revisar antes de pagar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Resumen</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {formData.metodoPago === 'paypal' ? 'PayPal' : 'Tarjeta'}
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Productos</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{f(costoEnvio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGV</span>
                    <span>{f(igv)}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>{f(total)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Detalles del pedido</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Dirección</span>
                    <span className="text-right">{formData.direccion || 'No especificada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ciudad</span>
                    <span>{formData.ciudad}</span>
                  </div>
                  {formData.documento && (
                    <div className="flex justify-between">
                      <span>Documento</span>
                      <span>{formData.documento}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Consejo profesional</p>
                <p className="mt-2">Verifica los datos de envío y el método de pago antes de confirmar. Así garantizas una compra sin contratiempos.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};