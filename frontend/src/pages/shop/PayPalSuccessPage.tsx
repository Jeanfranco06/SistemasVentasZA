import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export const PayPalSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading');
  const [message, setMessage] = useState('Verificando el pago...');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('No se encontró el identificador de PayPal en la URL.');
      return;
    }

    const verifyOrder = async () => {
      try {
        const response = await api.get(`/pagos/paypal/verificar?paypalOrderId=${encodeURIComponent(token)}`);
        const statusFromApi = response.data?.data?.status;

        if (statusFromApi === 'COMPLETED' || statusFromApi === 'completed') {
          setStatus('success');
          setMessage('El pago se completó correctamente. Gracias por tu compra.');
        } else {
          setStatus('error');
          setMessage(
            'El pago no se encuentra completado. Por favor revisa tu orden o vuelve a intentar.'
          );
        }
      } catch (error: any) {
        console.error('[PayPalSuccessPage] Error verificando pago:', error);
        toast.error('No se pudo verificar el pago con PayPal.');
        setStatus('error');
        setMessage(
          'Ocurrió un error al verificar el pago. Intenta nuevamente más tarde.'
        );
      }
    };

    verifyOrder();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm text-center">
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">Pago completado</h1>
          <p className="text-slate-600 mb-6">{message}</p>

          {status === 'loading' && (
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          )}

          {status === 'success' && (
            <div className="mb-6 rounded-3xl bg-emerald-50 p-4 text-emerald-800">
              Tu orden ya aparece como pagada. Puedes revisar el estado en "Mis órdenes".
            </div>
          )}

          {(status === 'error' || status === 'missing') && (
            <div className="mb-6 rounded-3xl bg-rose-50 p-4 text-rose-800">
              Si el pago se completó, revisa tu historial de órdenes. Si no, vuelve a intentar el proceso.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/mis-ordenes')}>Mis órdenes</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Volver al inicio</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
