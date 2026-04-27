// frontend/src/components/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export const MainLayout = () => {
  const { usuario, logout } = useAuthStore();
  const { items, eliminarItem, calcularTotales } = useCartStore();
  const { subtotal, igv, total } = calcularTotales();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-blue-600">StockFlow</h1>
          
          <nav className="flex items-center gap-4">
            {usuario ? (
              <>
                <span className="text-sm text-gray-600">Hola, {usuario.email}</span>
                {usuario.roles.includes('Administrador') && (
                  <Button variant="outline" onClick={() => window.location.href='/admin'}>Admin Panel</Button>
                )}
                <Button variant="ghost" onClick={logout}>Salir</Button>
              </>
            ) : (
              <Button onClick={() => window.location.href='/login'}>Login</Button>
            )}

            {/* Drawer del Carrito */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  🛒 Carrito
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {items.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] flex flex-col">
                <SheetHeader>
                  <SheetTitle>Tu Carrito de Compras</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                  {items.length === 0 ? <p className="text-gray-500">El carrito está vacío</p> : (
                    items.map(item => (
                      <div key={item.productoId} className="flex justify-between items-start border p-2 rounded">
                        <div>
                          <p className="font-medium text-sm">{item.nombre}</p>
                          <p className="text-xs text-gray-500">Cant: {item.cantidad} | Precio: S/ {item.precio.toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => eliminarItem(item.productoId)}>🗑️</Button>
                      </div>
                    ))
                  )}
                </div>
                <Separator />
                <div className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><span>S/ {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>IGV (18%):</span><span>S/ {igv.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>S/ {total.toFixed(2)}</span></div>
                  <Button className="w-full mt-2" disabled={items.length === 0} onClick={() => alert('Ir a Checkout')}>
                    Procesar Compra
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </header>

      {/* Contenido Dinámico */}
      <main className="flex-1 container mx-auto p-4 my-4">
        <Outlet />
      </main>
    </div>
  );
};