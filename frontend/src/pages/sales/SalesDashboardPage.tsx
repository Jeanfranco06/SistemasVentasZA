// frontend/src/pages/sales/SalesDashboardPage.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ventasApi } from '@/services/api';
import { TrendingUp, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardData {
  tasaConversion: number;
  ticketPromedio: number;
  abandonoCarrito: number;
  ordenesMes: number;
}

export const SalesDashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await ventasApi.dashboardVentas();
        setData(response.data.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Cargando dashboard...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Error al cargar los datos</p>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Órdenes del Mes',
      value: data.ordenesMes,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Ticket Promedio',
      value: `S/ ${parseFloat(data.ticketPromedio as any).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Tasa de Conversión',
      value: `${data.tasaConversion}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Ventas</h1>
        <p className="text-gray-600 mt-2">Resumen de métricas clave del mes</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información Rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-600">Carritos Abandonados</span>
            <span className="font-semibold text-gray-900">{data.abandonoCarrito}</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Total de órdenes procesadas este mes: <strong>{data.ordenesMes}</strong></p>
            <p className="mt-2">Venta promedio por orden: <strong>S/ {parseFloat(data.ticketPromedio as any).toFixed(2)}</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};