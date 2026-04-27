import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart.store';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

  const checkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/ordenes/checkout', data, { timeout: 30000 });
      return response;
    },
    onSuccess: (res) => {
      const { codigoOrden } = res.data.data;
      toast.success(`¡Orden ${codigoOrden} creada con éxito!`);
      limpiarCarrito();
      // Redirigimos al inicio o a una página de "Gracias por su compra"
      navigate('/');
    },
    onError: (err: any) => {
      if (err.code === 'ECONNABORTED') {
        toast.error('El servidor tardó demasiado. Intente nuevamente.');
      } else if (err.response?.data?.message) {
        // Aquí atrapará nuestros errores 400 "El producto ya no existe" sin cerrar sesión
        toast.error(err.response.data.message, { duration: 5000 });
      } else {
        toast.error('Ocurrió un error inesperado al procesar su orden.');
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

  const handleAtras = () => {
    const pasos = ['identificacion', 'direccion', 'envio', 'pago', 'revision'];
    const idxActual = pasos.indexOf(pasoActual);
    if (idxActual > 0) {
      setPasoActual(pasos[idxActual - 1] as Paso);
    }
  };

  const handleConfirmar = () => {
    if (items.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    // SANITIZACIÓN DEL FRONTEND: Mapeamos el array para garantizar que todo sea un número válido
    // Esto previene el NaN si por alguna razón un producto en Zustand quedó corrupto
    const itemsLimpios = items.map(item => ({
      productoId: Number(item.productoId),
      cantidad: Number(item.cantidad),
      precio: Number(item.precio) || 0, // Se envía como referencia, pero el Backend lo ignorará por seguridad
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
      items: itemsLimpios // Enviamos el array sanitizado
    });
  };

  // Formateador de moneda
  const f = (num: number) => `S/ ${num.toFixed(2)}`;

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      {/* Indicador de Pasos */}
      <div className="flex justify-between mb-8">
        {pasosConfig.map((p, i) => (
          <div 
            key={p.key} 
            className={`text-xs text-center cursor-pointer flex-1 pb-2 border-b-2 transition-colors ${
              pasoIndex === i ? 'border-blue-600 text-blue-600 font-bold' : 'border-gray-200 text-gray-400'
            }`}
            onClick={() => i <= pasoIndex && setPasoActual(p.key)}
          >
            <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs leading-5 mb-1">
              {i < pasoIndex ? '✓' : i + 1}
            </span>
            <br/>{p.nombre}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          
          {/* PASO 1: Identificación */}
          <div className={pasoActual !== 'identificacion' ? 'hidden' : 'space-y-4'}>
            <h2 className="text-xl font-semibold">Identificación</h2>
            <div>
              <Label>DNI / RUC (Opcional para boleta)</Label>
              <Input value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} placeholder="Ej: 12345678" />
            </div>
          </div>

          {/* PASO 2: Dirección */}
          <div className={pasoActual !== 'direccion' ? 'hidden' : 'space-y-4'}>
            <h2 className="text-xl font-semibold">Dirección de Envío</h2>
            <div>
              <Label>Dirección Completa <span className="text-red-500">*</span></Label>
              <Input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Principal 123, Dpto 402" />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} placeholder="Lima" />
            </div>
          </div>

          {/* PASO 3: Envío */}
          <div className={pasoActual !== 'envio' ? 'hidden' : 'space-y-4'}>
            <h2 className="text-xl font-semibold">Método de Envío</h2>
            <label className="flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-blue-50 hover:border-blue-200">
              <div className="flex items-center">
                <input type="radio" name="envio" checked className="mr-3" readOnly />
                <div>
                  <p className="font-medium">Estándar (3-5 días hábiles)</p>
                  <p className="text-xs text-gray-500">Entrega a domicilio verificada</p>
                </div>
              </div>
              <span className="font-bold text-sm">{f(costoEnvio)}</span>
            </label>
          </div>

          {/* PASO 4: Pago */}
          <div className={pasoActual !== 'pago' ? 'hidden' : 'space-y-4'}>
            <h2 className="text-xl font-semibold">Método de Pago</h2>
            <label className="flex items-center p-4 border rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200">
              <input type="radio" name="pago" checked className="mr-3" readOnly />
              <div>
                <p className="font-medium">Tarjeta de Crédito / Débito (Simulado)</p>
                <p className="text-xs text-gray-500">Pago seguro de prueba</p>
              </div>
            </label>
          </div>

          {/* PASO 5: REVISIÓN DETALLADA */}
          <div className={pasoActual !== 'revision' ? 'hidden' : 'space-y-6'}>
            <h2 className="text-xl font-semibold">Revisión de Compra</h2>
            
            {/* Lista de Productos */}
            <div className="bg-gray-50 border rounded-md overflow-hidden">
              <div className="bg-gray-200 px-4 py-2 text-xs font-bold text-gray-600 uppercase flex justify-between items-center">
                <span>Productos ({items.length})</span>
                <button 
                  onClick={() => navigate('/carrito')}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Modificar cantidades →
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                {items.map(i => (
                  <div key={i.productoId} className="flex justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-gray-800">{i.nombre}</p>
                      <p className="text-xs text-gray-500">SKU: {i.sku} · Cant: {i.cantidad}</p>
                    </div>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">{f(i.precio * i.cantidad)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Datos de Envío */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">Datos de Envío</p>
              <p className="text-sm text-gray-800"><span className="font-medium">Dirección:</span> {formData.direccion || 'No especificada'}</p>
              <p className="text-sm text-gray-800"><span className="font-medium">Ciudad:</span> {formData.ciudad}</p>
              {formData.documento && <p className="text-sm text-gray-800"><span className="font-medium">Documento:</span> {formData.documento}</p>}
            </div>

            {/* Desglose Contable Profesional */}
            <div className="bg-white border rounded-md overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 text-xs font-bold text-white uppercase">
                Resumen de Pago
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal Productos</span>
                  <span>{f(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío Estándar</span>
                  <span>{f(costoEnvio)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal Gravable (Base IGV 18%)</span>
                  <span>{f(subtotalGravable)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IGV (18%)</span>
                  <span>{f(igv)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-1">
                  <span>TOTAL A PAGAR</span>
                  <span className="text-blue-600">{f(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="flex justify-between pt-4 border-t">
            {pasoActual !== 'identificacion' ? (
              <Button variant="outline" onClick={handleAtras}>Atrás</Button>
            ) : <div></div>}
            
            <div className="ml-auto">
              {pasoActual !== 'revision' ? (
                <Button onClick={handleSiguiente}>Siguiente</Button>
              ) : (
                <Button 
                  onClick={handleConfirmar} 
                  disabled={checkoutMutation.isPending || items.length === 0}
                  className="bg-green-600 hover:bg-green-700 min-w-[180px] text-base"
                >
                  {checkoutMutation.isPending ? 'Procesando compra...' : 'Confirmar y Pagar'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};