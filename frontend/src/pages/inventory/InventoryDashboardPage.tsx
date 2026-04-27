// frontend/src/pages/inventory/InventoryDashboardPage.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { inventarioApi } from '@/services/api';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Truck,
  Users,
  ShoppingCart
} from 'lucide-react';

interface DashboardData {
  alertas: {
    stockBajo: number;
    productosStockBajo: Array<{
      producto: {
        nombre: string;
        sku: string;
      };
      stockFisico: number;
    }>;
  };
  estadisticas: {
    totalProductos: number;
    productosActivos: number;
    productosInactivos: number;
    ordenesCompraPendientes: number;
  };
}

export const InventoryDashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await inventarioApi.dashboardInventario();
        setData(response.data.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">Error al cargar los datos</div>;
  }

  const metrics = [
    {
      title: 'Total Productos',
      value: data.estadisticas.totalProductos.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Productos Activos',
      value: data.estadisticas.productosActivos.toString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Productos Inactivos',
      value: data.estadisticas.productosInactivos.toString(),
      icon: Package,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      title: 'Órdenes de Compra Pendientes',
      value: data.estadisticas.ordenesCompraPendientes.toString(),
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Inventario</h1>
        <p className="text-gray-600 mt-2">
          Control y monitoreo del inventario y proveedores
        </p>
      </div>

      {/* Alertas */}
      {data.alertas.stockBajo > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas de Stock ({data.alertas.stockBajo})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alertas.productosStockBajo.map((producto, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                  <div>
                    <span className="font-medium">{producto.producto.nombre}</span>
                    <span className="text-sm text-gray-500 ml-2">SKU: {producto.producto.sku}</span>
                  </div>
                  <Badge variant="default">
                    Stock: {producto.stockFisico}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <Package className="w-6 h-6 mb-2" />
              Crear Producto
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Truck className="w-6 h-6 mb-2" />
              Nueva Orden de Compra
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              Gestionar Proveedores
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};