import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
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
  useEffect(() => {
    // Cargar el script de PayPal
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}`;
    script.async = true;
    
    script.onload = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: async (data: any, actions: any) => {
            try {
              // Crear orden en el backend
              const { data: response } = await api.post('/pagos/paypal/crear-orden', {
                ordenInternalId: ordenId,
              });
              return response.data.paypalOrderId;
            } catch (error) {
              console.error('Error creando orden:', error);
              toast.error('Error al crear la orden de pago');
              onError();
              return actions.reject();
            }
          },
          
          onApprove: async (data: any, actions: any) => {
            try {
              // Capturar el pago
              const { data: response } = await api.post('/pagos/paypal/capturar', {
                paypalOrderId: data.orderID,
                ordenInternalId: ordenId,
              });
              
              toast.success('¡Pago completado exitosamente!');
              onSuccess(data.orderID);
            } catch (error) {
              console.error('Error capturando pago:', error);
              toast.error('Error al procesar el pago');
              onError();
            }
          },
          
          onError: (err: any) => {
            console.error('Error en PayPal:', err);
            toast.error('Error en el proceso de pago');
            onError();
          },
        }).render('#paypal-button-container');
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector(`script[src*="paypal"]`);
      if (existingScript) {
        existingScript.remove();
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
        <div id="paypal-button-container" className="w-full"></div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Está transacción es segura y es procesada por PayPal
      </div>
    </div>
  );
};
