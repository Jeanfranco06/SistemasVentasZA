// frontend/src/components/layout/AdminLayout.tsx
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Definición estricta del menú según SRS
const MenuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊', roles: ['Administrador', 'Gerente Ventas'] },
    { label: 'Productos', path: '/admin/productos', icon: '📦', roles: ['Administrador', 'Gerente Inventario'] },
    { label: 'Categorías', path: '/admin/categorias', icon: '🏷️', roles: ['Administrador', 'Gerente Inventario'] }, // NUEVO
    { label: 'Proveedores', path: '/admin/proveedores', icon: '🚛', roles: ['Administrador', 'Gerente Inventario'] },
    { label: 'Órdenes', path: '/admin/ordenes', icon: '🚚', roles: ['Administrador', 'Gerente Ventas', 'Vendedor'] },
    { label: 'Reportes PDF', path: '/admin/reportes', icon: '📄', roles: ['Administrador', 'Gerente Ventas', 'Gerente Inventario'] },
  ];

export const AdminLayout = () => {
  const { usuario, logout } = useAuthStore();
  const location = useLocation();

  // Si por alguna razón un cliente entra a /admin, lo expulsamos
  if (!usuario) return <Navigate to="/login" replace />;
  
  const esAdminTotal = usuario.roles.includes('Administrador');
  const tieneAccesoAdmin = usuario.roles.some(r => 
    ['Administrador', 'Gerente Ventas', 'Gerente Inventario', 'Vendedor'].includes(r)
  );

  if (!tieneAccesoAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">StockFlow Admin</h1>
          <p className="text-xs text-slate-400 mt-1">Rol: {usuario.roles.join(', ')}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {MenuItems.map(item => {
            // Mostrar solo si es Admin TOTAL o si su rol está en la lista permitida del item
            const permitido = esAdminTotal || usuario.roles.some(r => item.roles.includes(r));
            if (!permitido) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  location.pathname === item.path ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <a href="/" className="block text-sm text-slate-400 hover:text-white">Ir a la Tienda</a>
          <Button variant="ghost" className="w-full text-slate-300 hover:text-white justify-start" onClick={logout}>
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};