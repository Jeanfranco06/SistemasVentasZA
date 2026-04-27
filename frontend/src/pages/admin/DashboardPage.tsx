// frontend/src/pages/admin/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Datos simulados para la estructura (En producción se consumen de los endpoints de estadísticas)
const datosVentasTiempo = [
  { mes: 'Ene', ventas: 4000 }, { mes: 'Feb', ventas: 3000 }, { mes: 'Mar', ventas: 5000 }, { mes: 'Abr', ventas: 4500 }
];
const datosCategorias = [
  { nombre: 'Electrónica', ingresos: 4000 }, { nombre: 'Ropa', ingresos: 3000 }, { nombre: 'Hogar', ingresos: 2000 }
];
const datosEstados = [
  { name: 'Entregada', value: 400 }, { name: 'En Proceso', value: 300 }, { name: 'Pendiente', value: 200 }, { name: 'Cancelada', value: 100 }
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const KPICard = ({ titulo, valor, tendencia }: { titulo: string, valor: string, tendencia: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{titulo}</CardTitle>
      <span className={`text-xs font-bold ${tendencia === 'up' ? 'text-green-500' : 'text-red-500'}`}>{tendencia === 'up' ? '↑' : '↓'}</span>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{valor}</div>
    </CardContent>
  </Card>
);

export const DashboardPage = () => {
  // Consumo real del análisis RFM y ABC
  const { data: dataRFM } = useQuery({
    queryKey: ['estadisticas-rfm'],
    queryFn: async () => {
      const { data } = await api.get('/estadisticas/rfm');
      return data.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tablero de Control (Dashboard)</h1>
      
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard titulo="Ventas Totales (Mes)" valor="S/ 45,231" tendencia="up" />
        <KPICard titulo="Ticket Promedio" valor="S/ 350.00" tendencia="up" />
        <KPICard titulo="Tasa de Conversión" valor="3.2%" tendencia="down" />
        <KPICard titulo="Carritos Abandonados" valor="45" tendencia="down" />
      </div>

      {/* Gráficos de Primera Fila */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 1. Área: Ventas en el tiempo */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Ventas en el Tiempo</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosVentasTiempo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="ventas" stroke="#2563eb" fill="#bfdbfe" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Barras: Ventas por categoría */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Ingresos por Categoría (Top 5)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosCategorias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Segunda Fila */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 3. Pastel: Distribución estados orden */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Estados de Órdenes</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datosEstados} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {datosEstados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Líneas: Abandono de carrito */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-lg">Tendencia de Abandono de Carrito</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosVentasTiempo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ventas" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Módulo Analítico: Tabla RFM (Datos reales del Backend si hay conexión) */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Análisis RFM de Clientes (Cálculo en Backend)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Recencia (R)</th>
                  <th className="px-4 py-2">Frecuencia (F)</th>
                  <th className="px-4 py-2">Monetario (M)</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Segmento</th>
                </tr>
              </thead>
              <tbody>
                {dataRFM && dataRFM.length > 0 ? dataRFM.map((cli: any) => (
                  <tr key={cli.cliente_id} className="border-b">
                    <td className="px-4 py-2">{cli.razon_social || 'Consumidor Final'}</td>
                    <td className="px-4 py-2">{cli.R}</td>
                    <td className="px-4 py-2">{cli.F}</td>
                    <td className="px-4 py-2">{cli.M}</td>
                    <td className="px-4 py-2 font-bold">{cli.score_rfm}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${cli.segmento_rfm === 'VIP' ? 'bg-green-600' : 'bg-gray-500'}`}>
                        {cli.segmento_rfm}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center p-4 text-gray-500">Ejecutar ventas en el sistema para ver datos reales aquí.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};