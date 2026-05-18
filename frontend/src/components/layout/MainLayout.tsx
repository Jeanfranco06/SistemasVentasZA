// frontend/src/components/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, LogOut, LogIn, Shield, Trash2 } from 'lucide-react';

export const MainLayout = () => {
  const { usuario, logout } = useAuthStore();
  const { items, eliminarItem, calcularTotales } = useCartStore();
  const { subtotal, igv, total } = calcularTotales();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-600 tracking-tight">StockFlow</h1>
          
          <nav className="flex items-center gap-2 md:gap-4">
            {usuario ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-500 font-medium">Hola, {usuario.email.split('@')[0]}</span>
                {usuario.roles.includes('Administrador') && (
                  <Button variant="outline" size="sm" onClick={() => window.location.href='/admin'} className="gap-1.5 rounded-xl text-xs md:text-sm">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-slate-800 gap-1.5 rounded-xl text-xs md:text-sm">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href='/login'} size="sm" className="gap-1.5 rounded-xl">
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Button>
            )}

            {/* Drawer del Carrito */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative rounded-xl gap-1.5">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Carrito</span>
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                      {items.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[90vw] sm:w-[400px] flex flex-col">
                <SheetHeader>
                  <SheetTitle className="text-lg font-bold">Tu Carrito de Compras</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-medium">El carrito está vacío</p>
                    </div>
                  ) : (
                    items.map(item => (
                      <div key={item.productoId} className="flex justify-between items-start border border-slate-100 p-3 rounded-xl bg-slate-50/50 shadow-sm">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{item.nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Cant: {item.cantidad} | Precio: S/ {item.precio.toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => eliminarItem(item.productoId)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-medium">S/ {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>IGV (18%):</span><span className="font-medium">S/ {igv.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base text-slate-900"><span>Total:</span><span>S/ {total.toFixed(2)}</span></div>
                  <Button className="w-full mt-2 rounded-xl font-semibold" disabled={items.length === 0} onClick={() => alert('Ir a Checkout')}>
                    Procesar Compra
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </header>

      {/* Contenido Dinámico */}
      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        <Outlet />
      </main>
    </div>
  );
};