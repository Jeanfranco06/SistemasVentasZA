import { useEffect, useRef, useState, useCallback } from 'react';
import { loadScript, type PayPalNamespace } from '@paypal/paypal-js';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface PayPalCheckoutProps {
  ordenId: number;
  monto: number;
  onSuccess: (transactionId: string) => void;
  onError: () => void;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace | undefined;
  }
}

export const PayPalCheckout = ({ ordenId, monto, onSuccess, onError }: PayPalCheckoutProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const buttonInstanceRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const containerReadyRef = useRef(false);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Cargar SDK de PayPal
  useEffect(() => {
    isMountedRef.current = true;

    if (!clientId) {
      toast.error('Falta configurar VITE_PAYPAL_CLIENT_ID en el frontend.');
      setError('Client ID de PayPal no configurado');
      setIsLoading(false);
      onError();
      return;
    }

    // Si ya está cargado, no hacer nada
    if (window.paypal && window.paypal.Buttons) {
      setSdkLoaded(true);
      setIsLoading(false);
      return;
    }

    // Cargar SDK
    const loadPayPalSDK = async () => {
      try {
        await loadScript({
          clientId,
          currency: 'USD',
          intent: 'capture',
          components: 'buttons',
        });

        if (isMountedRef.current && window.paypal?.Buttons) {
          setSdkLoaded(true);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error cargando SDK de PayPal:', err);
        if (isMountedRef.current) {
          setError('No se pudo cargar el SDK de PayPal');
          setIsLoading(false);
          toast.error('No se pudo cargar PayPal. Verifica tu conexión.');
          onError();
        }
      }
    };

    loadPayPalSDK();

    return () => {
      isMountedRef.current = false;
    };
  }, [clientId, onError]);

  // Renderizar botones cuando el SDK y el contenedor estén listos
  const renderButtons = useCallback(async () => {
    // Verificar condiciones
    if (!isMountedRef.current) return;
    if (!sdkLoaded) return;
    if (!containerRef.current) return;

    // Evitar renderizado múltiple
    if (buttonInstanceRef.current) return;

    try {
      // Limpiar contenedor
      containerRef.current.innerHTML = '';

      if (!window.paypal?.Buttons) {
        throw new Error('PayPal Buttons no disponible');
      }

      // Crear botones
      const buttons = window.paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'paypal',
          height: 55,
        },

        createOrder: async () => {
          try {
            const { data: response } = await api.post('/pagos/paypal/crear-orden', {
              ordenInternalId: ordenId,
            });

            const paypalOrderId = response?.data?.paypalOrderId || response?.data?.data?.paypalOrderId;

            if (!paypalOrderId) {
              throw new Error('ID de orden PayPal no recibido');
            }

            return paypalOrderId;
          } catch (error: any) {
            console.error('Error creando orden PayPal:', error);
            const backendMessage = error?.response?.data?.message || error?.message || 'Error al crear la orden';
            toast.error(`Error al crear la orden de pago: ${backendMessage}`);
            onError();
            throw error;
          }
        },

        onApprove: async (data: any) => {
          try {
            await api.post('/pagos/paypal/capturar', {
              paypalOrderId: data.orderID,
              ordenInternalId: ordenId,
            });

            toast.success('¡Pago completado exitosamente!');
            onSuccess(data.orderID);
          } catch (error: any) {
            console.error('Error capturando pago:', error);
            const backendMessage = error?.response?.data?.message || error?.message || 'Error al procesar el pago';
            toast.error(`Error al procesar el pago: ${backendMessage}`);
            onError();
          }
        },

        onError: (err: any) => {
          console.error('Error en PayPal Buttons:', err);
          const errorMessage = err?.message || err?.details || 'Error en el proceso de pago';
          toast.error(`Error en PayPal: ${errorMessage}`);
          onError();
        },

        onCancel: () => {
          console.log('Pago cancelado por el usuario');
          toast('Pago cancelado. Puedes intentar nuevamente.', { icon: 'ℹ️' });
        },
      });

      // Renderizar
      await buttons.render('#paypal-button-container');
      buttonInstanceRef.current = buttons;

    } catch (err: any) {
      console.error('Error renderizando botones de PayPal:', err);
      if (isMountedRef.current) {
        setError(err?.message || 'Error al renderizar PayPal');
        toast.error('No se pudo cargar PayPal. Intenta nuevamente.');
        onError();
      }
    }
  }, [ordenId, onSuccess, onError, sdkLoaded]);

  // Efecto para renderizar cuando todo esté listo
  useEffect(() => {
    if (sdkLoaded && containerReadyRef.current && !buttonInstanceRef.current) {
      // Pequeño delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        renderButtons();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sdkLoaded, renderButtons]);

  // Marcar contenedor como listo después del primer render
  useEffect(() => {
    if (containerRef.current) {
      containerReadyRef.current = true;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (buttonInstanceRef.current) {
        try {
          buttonInstanceRef.current.close();
        } catch (err) {
          // Ignorar errores al cerrar
        }
        buttonInstanceRef.current = null;
      }
    };
  }, []);

  // Reintentar
  const handleRetry = () => {
    setError(null);
    buttonInstanceRef.current = null;
    containerReadyRef.current = false;
    setSdkLoaded(false);
    setIsLoading(true);

    // Recargar SDK
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Pequeño delay antes de reintentar
    setTimeout(() => {
      containerReadyRef.current = true;
      setSdkLoaded(false);
    }, 100);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">Error en PayPal</h3>
        <p className="text-red-800 text-sm mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Cargando PayPal...</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Pagar con PayPal</h3>
        <p className="text-blue-800 text-sm mb-4">
          Monto a pagar: <span className="font-bold">S/ {monto.toFixed(2)}</span>
        </p>
        <div ref={containerRef} id="paypal-button-container" className="w-full min-h-[150px]"></div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Esta transacción es segura y es procesada por PayPal
      </div>
    </div>
  );
};