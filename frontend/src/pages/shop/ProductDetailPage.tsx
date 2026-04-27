import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 py-10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="lg:w-1/2">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100" />
            </div>

            <div className="lg:w-1/2">
              <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Detalle del producto</p>
              <h1 className="mt-4 text-4xl font-semibold text-slate-900">Información del producto</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                Selecciona un producto desde el catálogo para ver su información completa, precio, disponibilidad y características.
                Esta vista está preparada para mostrar todos los detalles relevantes de tu compra.
              </p>

              <div className="mt-8 space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Producto</span>
                  <span className="font-semibold text-slate-900">No seleccionado</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Precio</span>
                  <span className="font-semibold text-slate-900">S/ 0.00</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Disponibilidad</span>
                  <span className="font-semibold text-slate-900">En stock</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>SKU</span>
                  <span className="font-semibold text-slate-900">-</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate('/')}>Regresar al catálogo</Button>
                <Button variant="outline" onClick={() => navigate('/carrito')}>Ver carrito</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
