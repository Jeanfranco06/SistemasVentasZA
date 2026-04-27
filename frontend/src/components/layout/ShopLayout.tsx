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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          
          {/* LADO IZQUIERDO: Logo + Menú Tienda */}
          <div className="flex items-center gap-6">
            <h1 
              className="text-2xl font-bold text-blue-600 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              StockFlow
            </h1>
            
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
              <span 
                className="hover:text-blue-600 cursor-pointer transition-colors" 
                onClick={() => navigate('/')}
              >
                Catálogo
              </span>
              {usuario && (
                <>
                  <span 
                    className="hover:text-blue-600 cursor-pointer flex items-center gap-1" 
                    onClick={() => navigate('/mis-deseos')}
                  >
                    💝 Deseos
                  </span>
                  <span 
                    className="hover:text-blue-600 cursor-pointer flex items-center gap-1" 
                    onClick={() => navigate('/mis-ordenes')}
                  >
                    📦 Mis Órdenes
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* LADO DERECHO: Acciones + Carrito + Cerrar Sesión */}
          <div className="flex items-center gap-3">
            {usuario ? (
              <span className="hidden sm:block text-sm text-gray-500 border-r pr-3">
                Hola, {usuario.email.split('@')[0]}
              </span>
            ) : (
              <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
            )}

            {/* Carrito */}
            <Button variant="outline" className="relative" onClick={() => navigate('/carrito')}>
              🛒 Carrito
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {items.length}
                </span>
              )}
            </Button>

            {/* Botón Salir */}
            {usuario && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                Salir
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 my-4">
        <Outlet />
      </main>
    </div>
  );
};