import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A855F7', '#F97316'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type ResumenVentaTiempo = {
  año: number;
  mes: number;
  ventas: number;
};

type ResumenCategoria = {
  id: number;
  nombre: string;
  ingresos: number;
};

type ResumenEstadoOrden = {
  estadoId?: number;
  estado?: string;
  cantidad: number;
};

type ClienteRFM = {
  cliente_id: number;
  razon_social: string | null;
  dias_desde_ultima_compra: number;
  frecuencia: number;
  valor_monetario: number;
  R: number;
  F: number;
  M: number;
  score_rfm: number;
  segmento_rfm: string;
};

type ResumenEstadisticas = {
  ventasMes: {
    total_ordenes: number;
    total_ventas: number;
    ticket_promedio: number;
  };
  ingresosCategorias: ResumenCategoria[];
  estadosOrdenes: ResumenEstadoOrden[];
  tasaConversion: number;
  carritosAbandonados: number;
  ventasTiempo: ResumenVentaTiempo[];
  carritosActivos?: number;
  rfmDatos?: ClienteRFM[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const KPICard = ({ titulo, valor, tendencia }: { titulo: string; valor: string; tendencia: 'up' | 'down' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{titulo}</CardTitle>
      <span className={`text-xs font-bold ${tendencia === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {tendencia === 'up' ? '↑' : '↓'}
      </span>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{valor}</div>
    </CardContent>
  </Card>
);

const ChartPlaceholder = ({ text }: { text: string }) => (
  <div className="flex h-full w-full min-w-0 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
    {text}
  </div>
);

const useChartSurfaceReady = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const updateReadyState = () => {
      const { width, height } = element.getBoundingClientRect();
      setIsReady(width > 0 && height > 0);
    };

    updateReadyState();

    if (typeof ResizeObserver === 'undefined') {
      const id = window.requestAnimationFrame(updateReadyState);
      return () => window.cancelAnimationFrame(id);
    }

    const observer = new ResizeObserver(() => updateReadyState());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, isReady };
};

const ChartSurface = ({ children }: { children: ReactNode }) => {
  const { ref, isReady } = useChartSurfaceReady();

  return (
    <div ref={ref} className="h-full w-full min-w-0 overflow-hidden">
      {isReady ? children : <ChartPlaceholder text="Cargando gráfica..." />}
    </div>
  );
};

export const DashboardPage = () => {
  const { data: resumen, isLoading: isLoadingResumen } = useQuery<ResumenEstadisticas>({
    queryKey: ['estadisticas-resumen'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ResumenEstadisticas }>('/estadisticas/resumen');
      return response.data.data;
    },
  });

  const ventasTiempo = useMemo(
    () =>
      (resumen?.ventasTiempo ?? []).map((item) => ({
        mes: MESES[item.mes - 1] ?? `Mes ${item.mes}`,
        ventas: item.ventas,
      })),
    [resumen?.ventasTiempo]
  );

  const ingresosCategorias = resumen?.ingresosCategorias ?? [];
  const estadosOrdenes = useMemo(
    () =>
      (resumen?.estadosOrdenes ?? []).map((estado) => ({
        name: estado.estado ?? (estado.estadoId ? `Estado ${estado.estadoId}` : 'Sin estado'),
        value: estado.cantidad,
      })),
    [resumen?.estadosOrdenes]
  );

  const ventasMes = resumen?.ventasMes;
  const kpis = [
    {
      titulo: 'Ventas Totales (Mes)',
      valor: isLoadingResumen || !ventasMes ? 'Cargando...' : formatCurrency(ventasMes.total_ventas),
      tendencia: 'up' as const,
    },
    {
      titulo: 'Ticket Promedio',
      valor: isLoadingResumen || !ventasMes ? 'Cargando...' : formatCurrency(ventasMes.ticket_promedio),
      tendencia: 'up' as const,
    },
    {
      titulo: 'Tasa de Conversión',
      valor: isLoadingResumen ? 'Cargando...' : formatPercent(resumen?.tasaConversion ?? 0),
      tendencia: 'down' as const,
    },
    {
      titulo: 'Carritos Abandonados',
      valor: isLoadingResumen ? 'Cargando...' : String(resumen?.carritosAbandonados ?? 0),
      tendencia: 'down' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tablero de Control (Dashboard)</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.titulo} titulo={kpi.titulo} valor={kpi.valor} tendencia={kpi.tendencia} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ventas en el Tiempo</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-w-0">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasTiempo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="ventas" stroke="#2563eb" fill="#bfdbfe" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos por Categoría (Top 5)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-w-0">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosCategorias} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estados de Órdenes</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-w-0">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosOrdenes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {estadosOrdenes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolución de Ventas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-w-0">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasTiempo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventas" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análisis RFM de Clientes (Cálculo en Backend)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Días sin comprar</th>
                  <th className="px-4 py-2">Frecuencia</th>
                  <th className="px-4 py-2">Monetario (S/)</th>
                  <th className="px-4 py-2">R</th>
                  <th className="px-4 py-2">F</th>
                  <th className="px-4 py-2">M</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Segmento</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingResumen ? (
                  <tr>
                    <td colSpan={9} className="text-center p-4 text-gray-500">
                      Cargando análisis RFM...
                    </td>
                  </tr>
                ) : (resumen?.rfmDatos ?? []).length > 0 ? (
                  (resumen?.rfmDatos ?? []).map((cli) => (
                    <tr key={cli.cliente_id} className="border-b">
                      <td className="px-4 py-2">{cli.razon_social || 'Consumidor Final'}</td>
                      <td className="px-4 py-2">{cli.dias_desde_ultima_compra ?? '-'}</td>
                      <td className="px-4 py-2">{cli.frecuencia}</td>
                      <td className="px-4 py-2">{Number(cli.valor_monetario).toFixed(2)}</td>
                      <td className="px-4 py-2 font-bold">{cli.R}</td>
                      <td className="px-4 py-2 font-bold">{cli.F}</td>
                      <td className="px-4 py-2 font-bold">{cli.M}</td>
                      <td className="px-4 py-2 font-bold">{cli.score_rfm}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${cli.segmento_rfm === 'VIP' ? 'bg-green-600' : cli.segmento_rfm === 'Leal' ? 'bg-blue-600' : cli.segmento_rfm === 'Potencial' ? 'bg-yellow-600' : 'bg-gray-500'}`}>
                          {cli.segmento_rfm}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center p-4 text-gray-500">
                      Se requieren órdenes con estado 'pagada', 'en_proceso' o 'completada' para ver el análisis RFM.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
