import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const PayPalCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm text-center">
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">Pago cancelado</h1>
          <p className="text-slate-600 mb-6">
            El pago con PayPal fue cancelado. Puedes regresar al checkout para intentarlo de nuevo.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/checkout')}>Volver al checkout</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Ir al inicio</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
