import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export const ShopLayout = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const { items, eliminarItem, calcularTotales } = useCartStore();
  const { subtotal, igv, total } = calcularTotales();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-950/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="cursor-pointer rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-semibold tracking-tight text-white shadow-sm shadow-slate-950/20 transition hover:border-slate-500"
              onClick={() => navigate('/')}
            >
              StockFlow
            </div>
            <div className="hidden items-center gap-5 text-sm font-medium text-slate-300 md:flex">
              <button
                className="transition hover:text-white"
                onClick={() => navigate('/')}
              >
                Catálogo
              </button>
              {usuario && (
                <>
                  <button
                    className="transition hover:text-white"
                    onClick={() => navigate('/mis-deseos')}
                  >
                    Deseos
                  </button>
                  <button
                    className="transition hover:text-white"
                    onClick={() => navigate('/mis-ordenes')}
                  >
                    Mis Órdenes
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {usuario ? (
              <div className="rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 shadow-sm shadow-slate-950/10">
                Hola, <span className="font-semibold text-white">{usuario.email.split('@')[0]}</span>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Iniciar sesión
              </Button>
            )}

            <Button variant="outline" className="relative" onClick={() => navigate('/carrito')}>
              🛒 Carrito
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                  {items.length}
                </span>
              )}
            </Button>

            {usuario && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-400 hover:text-white hover:bg-rose-500/10"
                onClick={logout}
              >
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto flex min-h-[calc(100vh-11rem)] flex-col justify-between px-4 py-4">
        <div className="flex-1">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/80 py-6 text-slate-600 shadow-inner shadow-slate-100">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm md:flex-row">
          <p>© {new Date().getFullYear()} StockFlow. Tienda corporativa de tecnología.</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <button className="transition hover:text-slate-900" onClick={() => navigate('/')}>Inicio</button>
            <button className="transition hover:text-slate-900" onClick={() => navigate('/carrito')}>Carrito</button>
            <button className="transition hover:text-slate-900" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};