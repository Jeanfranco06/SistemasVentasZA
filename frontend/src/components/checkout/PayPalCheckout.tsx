import { useEffect, useRef } from 'react';
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
    paypal?: any;
  }
}

export const PayPalCheckout = ({ ordenId, monto, onSuccess, onError }: PayPalCheckoutProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let buttonInstance: any = null;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      toast.error('Falta configurar VITE_PAYPAL_CLIENT_ID en el frontend.');
      onError();
      return;
    }

    const renderButtons = () => {
      if (cancelled) return;
      if (!window.paypal) {
        console.error('PayPal SDK no se cargó correctamente.');
        toast.error('No se pudo cargar PayPal. Revise la configuración.');
        onError();
        return;
      }

      if (!containerRef.current) {
        console.error('PayPal button container no existe al renderizar.');
        toast.error('No se encontró el contenedor de PayPal. Intente nuevamente.');
        onError();
        return;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      buttonInstance = window.paypal.Buttons({
        createOrder: async (_data: any, actions: any) => {
          try {
            const { data: response } = await api.post('/pagos/paypal/crear-orden', {
              ordenInternalId: ordenId,
            });
            const paypalOrderId = response?.data?.paypalOrderId || response?.data?.data?.paypalOrderId;
            if (!paypalOrderId) {
              throw new Error('ID de orden PayPal no recibido.');
            }
            return paypalOrderId;
          } catch (error: any) {
            console.error('Error creando orden:', error);
            const backendMessage = error?.response?.data?.message || error?.message;
            toast.error(`Error al crear la orden de pago: ${backendMessage}`);
            onError();
            return actions.reject?.() ?? Promise.reject(error);
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
            const backendMessage = error?.response?.data?.message || error?.message;
            toast.error(`Error al procesar el pago: ${backendMessage}`);
            onError();
          }
        },

        onError: (err: any) => {
          console.error('Error en PayPal:', err);
          const backendMessage = err?.message || err?.details || 'Error en el proceso de pago';
          toast.error(`Error en el proceso de pago: ${backendMessage}`);
          onError();
        },
      });

      buttonInstance && buttonInstance.render(containerRef.current);
    };

    const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
    if (existingScript && window.paypal) {
      renderButtons();
    } else {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;

      script.onload = () => {
        if (cancelled) return;
        renderButtons();
      };

      script.onerror = () => {
        if (cancelled) return;
        console.error('Error al cargar el SDK de PayPal.');
        toast.error('No se pudo cargar PayPal. Revise la configuración de cliente.');
        onError();
      };

      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (buttonInstance?.close) {
        try {
          buttonInstance.close();
        } catch (error) {
          console.warn('No se pudo cerrar el botón PayPal:', error);
        }
      }
    };
  }, [ordenId, onSuccess, onError]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Pagar con PayPal</h3>
        <p className="text-blue-800 text-sm mb-4">
          Monto a pagar: <span className="font-bold">S/ {monto.toFixed(2)}</span>
        </p>
        <div ref={containerRef} id="paypal-button-container" className="w-full"></div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Está transacción es segura y es procesada por PayPal
      </div>
    </div>
  );
};
