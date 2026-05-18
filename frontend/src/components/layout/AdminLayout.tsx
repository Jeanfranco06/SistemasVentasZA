// frontend/src/components/layout/AdminLayout.tsx
import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ClipboardList,
  FileBarChart2,
  Menu,
  X,
  LogOut,
  Store,
  Shield,
} from 'lucide-react';

// Definición estricta del menú según SRS
const MenuItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['Administrador', 'Gerente Ventas'] },
  { label: 'Productos', path: '/admin/productos', icon: Package, roles: ['Administrador', 'Gerente Inventario'] },
  { label: 'Categorías', path: '/admin/categorias', icon: Tags, roles: ['Administrador', 'Gerente Inventario'] },
  { label: 'Proveedores', path: '/admin/proveedores', icon: Truck, roles: ['Administrador', 'Gerente Inventario'] },
  { label: 'Órdenes', path: '/admin/ordenes', icon: ClipboardList, roles: ['Administrador', 'Gerente Ventas', 'Vendedor'] },
  { label: 'Reportes PDF', path: '/admin/reportes', icon: FileBarChart2, roles: ['Administrador', 'Gerente Ventas', 'Gerente Inventario'] },
];

export const AdminLayout = () => {
  const { usuario, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Si por alguna razón un cliente entra a /admin, lo expulsamos
  if (!usuario) return <Navigate to="/login" replace />;
  
  const esAdminTotal = usuario.roles.includes('Administrador');
  const tieneAccesoAdmin = usuario.roles.some(r => 
    ['Administrador', 'Gerente Ventas', 'Gerente Inventario', 'Vendedor'].includes(r)
  );

  if (!tieneAccesoAdmin) return <Navigate to="/" replace />;

  const sidebarContent = (
    <>
      {/* Branding */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/20">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">StockFlow</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Panel Administrativo</p>
          </div>
        </div>
        <div className="mt-3 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/30">
          <p className="text-xs text-slate-300 font-medium truncate">{usuario.email}</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{usuario.roles.join(', ')}</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {MenuItems.map(item => {
          const permitido = esAdminTotal || usuario.roles.some(r => item.roles.includes(r));
          if (!permitido) return null;

          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-blue-600/90 text-white shadow-lg shadow-blue-900/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Icon className={cn(
                "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 space-y-1.5">
        <a 
          href="/" 
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-all duration-200 text-sm"
        >
          <Store className="h-[18px] w-[18px] text-slate-500" />
          <span>Ir a la Tienda</span>
        </a>
        <Button 
          variant="ghost" 
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800/60 justify-start gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm h-auto font-normal" 
          onClick={logout}
        >
          <LogOut className="h-[18px] w-[18px] text-slate-500" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (siempre visible) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile (drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-out lg:hidden shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">StockFlow Admin</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};