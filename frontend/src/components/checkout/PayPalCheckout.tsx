import { useEffect, useRef, useState, useCallback } from 'react';
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

// Función para cargar el SDK de PayPal desde el CDN
const loadPayPalSDKScript = (clientId: string, currency: string = 'USD'): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Verificar si ya está cargado
    if (window.paypal?.Buttons) {
      console.log('[PayPal] SDK ya está cargado en window');
      resolve();
      return;
    }

    // Verificar si el script ya se está cargando
    if (document.querySelector('script[src*="paypal.com/sdk"]')) {
      console.log('[PayPal] Script ya está en el DOM');
      // Esperar a que se cargue
      let attempts = 0;
      const checkInterval = setInterval(() => {
        if (window.paypal?.Buttons) {
          clearInterval(checkInterval);
          resolve();
        }
        attempts++;
        if (attempts > 50) { // 5 segundos máximo
          clearInterval(checkInterval);
          reject(new Error('PayPal SDK no se cargó a tiempo'));
        }
      }, 100);
      return;
    }

    // Crear el script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&components=buttons`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[PayPal] Script cargado del CDN');
      // Esperar a que PayPal esté disponible
      let attempts = 0;
      const checkInterval = setInterval(() => {
        if (window.paypal?.Buttons) {
          console.log('[PayPal] window.paypal.Buttons disponible');
          clearInterval(checkInterval);
          resolve();
        }
        attempts++;
        if (attempts > 50) {
          clearInterval(checkInterval);
          reject(new Error('PayPal Buttons no se inicializó'));
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('[PayPal] Error cargando script del CDN');
      reject(new Error('No se pudo cargar el script de PayPal'));
    };

    document.head.appendChild(script);
  });
};

export const PayPalCheckout = ({ ordenId, monto, onSuccess, onError }: PayPalCheckoutProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const buttonInstanceRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const apiUrl = import.meta.env.VITE_API_URL;

  // Debug logging
  useEffect(() => {
    console.log('[PayPal] Configuración:', { 
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'NO CONFIGURADO',
      apiUrl: apiUrl || 'NO CONFIGURADA'
    });
  }, []);

  // Cargar SDK de PayPal
  useEffect(() => {
    isMountedRef.current = true;

    if (!clientId) {
      console.error('VITE_PAYPAL_CLIENT_ID no está configurado');
      setError('PayPal no está configurado. Contacta al administrador.');
      setIsLoading(false);
      toast.error('PayPal no está disponible.');
      onError();
      return;
    }

    const loadSDK = async () => {
      try {
        console.log('[PayPal] Iniciando carga del SDK...');
        await loadPayPalSDKScript(clientId, 'USD');
        
        if (isMountedRef.current) {
          console.log('[PayPal] SDK cargado exitosamente');
          setSdkLoaded(true);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('[PayPal] Error:', err);
        if (isMountedRef.current) {
          setError(err.message || 'Error al cargar PayPal');
          setIsLoading(false);
          toast.error('No se pudo cargar PayPal');
          onError();
        }
      }
    };

    loadSDK();

    return () => {
      isMountedRef.current = false;
    };
  }, [clientId, onError]);

  // Renderizar botones cuando el SDK esté listo
  useEffect(() => {
    if (!sdkLoaded || !containerRef.current || buttonInstanceRef.current) {
      return;
    }

    const renderButtons = async () => {
      try {
        if (!window.paypal?.Buttons) {
          throw new Error('PayPal Buttons no está disponible');
        }

        console.log('[PayPal] Renderizando botones...');

        // Limpiar contenedor
        containerRef.current!.innerHTML = '';

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
              console.log('[PayPal] Creando orden con monto:', monto);
              const { data: response } = await api.post('/pagos/paypal/crear-orden', {
                ordenInternalId: ordenId,
              });

              const paypalOrderId = response?.data?.paypalOrderId || response?.data?.data?.paypalOrderId;

              if (!paypalOrderId) {
                throw new Error('ID de orden PayPal no recibido');
              }

              console.log('[PayPal] Orden creada:', paypalOrderId);
              return paypalOrderId;
            } catch (error: any) {
              console.error('[PayPal] Error creando orden:', error);
              const backendMessage = error?.response?.data?.message || error?.message || 'Error al crear la orden';
              toast.error(`Error: ${backendMessage}`);
              throw error;
            }
          },

          onApprove: async (data: any) => {
            try {
              console.log('[PayPal] Aprobado por usuario:', data.orderID);
              await api.post('/pagos/paypal/capturar', {
                paypalOrderId: data.orderID,
                ordenInternalId: ordenId,
              });

              toast.success('¡Pago completado exitosamente!');
              onSuccess(data.orderID);
            } catch (error: any) {
              console.error('[PayPal] Error capturando:', error);
              const msg = error?.response?.data?.message || error?.message;
              toast.error(`Error: ${msg}`);
              onError();
            }
          },

          onError: (err: any) => {
            console.error('[PayPal] Error en Buttons:', err);
            toast.error(`Error PayPal: ${err?.message || 'Unknown error'}`);
            onError();
          },

          onCancel: () => {
            console.log('[PayPal] Cancelado por usuario');
            toast('Pago cancelado', { icon: 'ℹ️' });
          },
        });

        // Renderizar
        await buttons.render('#paypal-button-container');
        buttonInstanceRef.current = buttons;
        console.log('[PayPal] Botones renderizados exitosamente');

      } catch (err: any) {
        console.error('[PayPal] Error renderizando:', err);
        if (isMountedRef.current) {
          setError(err?.message || 'Error al renderizar');
          toast.error('Error al cargar PayPal');
          onError();
        }
      }
    };

    renderButtons();

  }, [sdkLoaded, ordenId, monto, onSuccess, onError]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (buttonInstanceRef.current) {
        try {
          buttonInstanceRef.current.close();
        } catch (err) {
          // Ignorar
        }
        buttonInstanceRef.current = null;
      }
    };
  }, []);

  // Reintentar
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    buttonInstanceRef.current = null;
    setSdkLoaded(false);
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
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