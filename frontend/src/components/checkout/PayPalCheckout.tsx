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
  const buttonInstanceRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Función para limpiar el contenedor
  const clearContainer = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, []);

  // Función para cerrar la instancia de PayPal de manera segura
  const closePayPalButtons = useCallback(() => {
    if (buttonInstanceRef.current) {
      try {
        buttonInstanceRef.current.close();
      } catch (err) {
        console.warn('Error al cerrar botones de PayPal:', err);
      }
      buttonInstanceRef.current = null;
    }
    clearContainer();
  }, [clearContainer]);

  // Renderizar botones de PayPal
  const renderPayPalButtons = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Verificar que el contenedor exista
    if (!containerRef.current) {
      console.error('Contenedor de PayPal no disponible');
      setError('Contenedor de PayPal no disponible');
      onError();
      return;
    }

    // Limpiar contenedor antes de renderizar
    clearContainer();

    try {
      // Inicializar PayPal SDK
      if (!window.paypal) {
        await loadScript({
          clientId,
          currency: 'USD',
          intent: 'capture',
          components: 'buttons',
        });
      }

      if (!window.paypal || !window.paypal.Buttons) {
        throw new Error('PayPal SDK no se cargó correctamente');
      }

      // Crear botones de PayPal
      const buttons = window.paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'paypal',
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

      // Verificar si el contenedor sigue existiendo
      if (!containerRef.current) {
        console.warn('Contenedor no disponible para renderizar botones');
        return;
      }

      // Renderizar botones
      await buttons.render(containerRef.current);
      buttonInstanceRef.current = buttons;
      setIsLoading(false);

    } catch (err: any) {
      console.error('Error al inicializar PayPal:', err);
      setError(err?.message || 'Error al cargar PayPal');
      toast.error('No se pudo cargar PayPal. Verifica tu configuración.');
      setIsLoading(false);
      onError();
    }
  }, [clientId, ordenId, onSuccess, onError, clearContainer]);

  // Efecto principal para cargar y renderizar PayPal
  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);

    if (!clientId) {
      toast.error('Falta configurar VITE_PAYPAL_CLIENT_ID en el frontend.');
      setError('Client ID de PayPal no configurado');
      setIsLoading(false);
      onError();
      return;
    }

    // Verificar si el SDK ya está cargado
    if (window.paypal && window.paypal.Buttons) {
      renderPayPalButtons();
    } else {
      renderPayPalButtons();
    }

    // Cleanup al desmontar
    return () => {
      isMountedRef.current = false;
      closePayPalButtons();
    };
  }, [ordenId, renderPayPalButtons, closePayPalButtons, onError]);

  // Reintentar carga si hay error
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    closePayPalButtons();
    renderPayPalButtons();
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