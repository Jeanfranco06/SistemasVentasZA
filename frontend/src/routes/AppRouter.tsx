// frontend/src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SalesManagerLayout } from '@/components/layout/SalesManagerLayout';
import { InventoryManagerLayout } from '@/components/layout/InventoryManagerLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ProductListPage } from '@/pages/shop/ProductListPage';
import { ProductDetailPage } from '@/pages/shop/ProductDetailPage';
import { CheckoutWizardPage } from '@/pages/shop/CheckoutWizardPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ProductFormPage } from '@/pages/admin/ProductFormPage';
import { OrdersAdminPage } from '@/pages/admin/OrdersAdminPage';
import { ProvidersAdminPage } from '@/pages/admin/ProvidersAdminPage';
import { ReportsAdminPage } from '@/pages/admin/ReportsAdminPage';
import { ProductsAdminPage } from '@/pages/admin/ProductsAdminPage';
import { CategoriesAdminPage } from '@/pages/admin/CategoriesAdminPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MyOrdersPage } from '@/pages/shop/MyOrdersPage';
import { WishlistPage } from '@/pages/shop/WishlistPage';
import { CartPage } from '@/pages/shop/CartPage';
import { SalesDashboardPage } from '@/pages/sales/SalesDashboardPage';
import { SalesOrdersPage } from '@/pages/sales/SalesOrdersPage';
import { InventoryDashboardPage } from '@/pages/inventory/InventoryDashboardPage';
import { InventoryProductsPage } from '@/pages/inventory/InventoryProductsPage';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de Autenticación (Sin Layout) */}
        <Route path="/login" element={<LoginPage />} />

        {/* ========================================== */}
        {/* RUTAS DE TIENDA (Público/Clientes) */}
        {/* ========================================== */}
        <Route element={<ShopLayout />}>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/producto/:id" element={<ProductDetailPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={
            <ProtectedRoute roles={[]}>
              <CheckoutWizardPage />
            </ProtectedRoute>
          } />
          <Route path="/mis-ordenes" element={<ProtectedRoute roles={[]}><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/mis-deseos" element={<ProtectedRoute roles={[]}><WishlistPage /></ProtectedRoute>} />
        </Route>

        {/* ========================================== */}
        {/* RUTAS DE ADMINISTRACIÓN (Roles RBAC) */}
        {/* ========================================== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="productos" element={<ProductsAdminPage />} />
          <Route path="productos/nuevo" element={<ProductFormPage />} />
          <Route path="productos/editar/:id" element={<ProductFormPage />} /> {/* NUEVA RUTA DINÁMICA */}
          <Route path="categorias" element={<CategoriesAdminPage />} /> {/* NUEVO MÓDULO */}
          <Route path="proveedores" element={<ProvidersAdminPage />} />
          <Route path="ordenes" element={<OrdersAdminPage />} />
          <Route path="reportes" element={<ReportsAdminPage />} />
        </Route>

        {/* ========================================== */}
        {/* RUTAS DE GERENTE DE VENTAS */}
        {/* ========================================== */}
        <Route path="/ventas" element={
          <ProtectedRoute roles={['Gerente Ventas']}>
            <SalesManagerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SalesDashboardPage />} />
          <Route path="ordenes" element={<SalesOrdersPage />} />
          {/* TODO: Agregar más rutas según se implementen las páginas */}
        </Route>

        {/* ========================================== */}
        {/* RUTAS DE GERENTE DE INVENTARIO */}
        {/* ========================================== */}
        <Route path="/inventario" element={
          <ProtectedRoute roles={['Gerente Inventario']}>
            <InventoryManagerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<InventoryDashboardPage />} />
          <Route path="productos" element={<InventoryProductsPage />} />
          <Route path="productos/nuevo" element={<ProductFormPage />} />
          <Route path="productos/editar/:id" element={<ProductFormPage />} />
          {/* TODO: Agregar más rutas según se implementen las páginas */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};