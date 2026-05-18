// frontend/src/components/layout/InventoryManagerLayout.tsx
import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Package,
  LogOut,
  Home,
  Menu,
  X,
  Warehouse,
} from 'lucide-react';

export const InventoryManagerLayout = () => {
  const { logout, usuario } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/inventario' },
    { icon: Package, label: 'Productos', path: '/inventario/productos' },
  ];

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Warehouse className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight">Inventario</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Panel de Almacén</p>
          </div>
        </div>
        <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <p className="text-xs text-slate-600 font-medium truncate">{usuario?.email || 'Usuario'}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-sm",
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-[18px] h-[18px] flex-shrink-0",
                isActive ? "text-white" : "text-slate-400"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <Button 
          variant="ghost" 
          className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm h-auto font-normal" 
          onClick={handleLogout}
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Salir</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 left-0 z-30 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transform transition-transform duration-300 ease-out lg:hidden shadow-2xl border-r border-slate-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-slate-800 text-sm">Gerente de Inventario</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};