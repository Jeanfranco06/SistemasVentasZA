import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingBag,
  Percent,
  ShoppingCart,
  TrendingUp,
  Info,
  Calendar,
  Users,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
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
  Legend,
} from 'recharts';

const ESTADO_COLORS: Record<string, string> = {
  'pendiente_pago': '#fbbf24', // Amber/Yellow
  'pagada': '#10b981',         // Emerald Green
  'en_proceso': '#6366f1',     // Indigo Blue
  'enviada': '#8b5cf6',        // Purple/Violet
  'entregada': '#06b6d4',      // Cyan/Teal
  'cancelada': '#f43f5e',      // Rose/Red
};

const ESTADO_TRADUCCIONES: Record<string, string> = {
  'pendiente_pago': 'Pendiente de Pago',
  'pagada': 'Pagada',
  'en_proceso': 'En Proceso',
  'enviada': 'Enviada',
  'entregada': 'Entregada',
  'cancelada': 'Cancelada',
};

const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#06b6d4', '#f43f5e'];
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

const KPICard = ({
  titulo,
  valor,
  tendencia,
  icon: Icon,
  description,
  colorClass,
}: {
  titulo: string;
  valor: string;
  tendencia: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  colorClass: string;
}) => (
  <Card className="relative overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
    <div className={`absolute top-0 left-0 h-[4px] w-full ${colorClass}`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">{titulo}</CardTitle>
      <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600 transition-all duration-300">
        <Icon className="h-5 w-5" />
      </div>
    </CardHeader>
    <CardContent className="pt-2">
      <div className="text-3xl font-extrabold tracking-tight text-slate-800">{valor}</div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
          tendencia === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {tendencia === 'up' ? '↑' : '↓'} Activo
        </span>
        <span className="text-[11px] font-medium text-slate-400">{description}</span>
      </div>
    </CardContent>
  </Card>
);

const ChartPlaceholder = ({ text }: { text: string }) => (
  <div className="flex h-full w-full min-w-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-400">
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

const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-extrabold text-blue-600">
          {prefix}{payload[0].value.toLocaleString('es-PE')}
        </p>
      </div>
    );
  }
  return null;
};

const RFMExplanationCard = () => (
  <Card className="border-0 bg-slate-900 text-white shadow-xl relative overflow-hidden">
    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 rounded-full bg-blue-500/10 blur-xl" />
    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 rounded-full bg-indigo-500/10 blur-xl" />
    
    <CardHeader>
      <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
        <Info className="h-5 w-5 text-blue-400" />
        Análisis de Segmentación RFM (Recencia, Frecuencia, Valor Monetario)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-slate-300 relative z-10">
      <p>
        El modelo **RFM** analiza el comportamiento transaccional real para segmentar automáticamente tu cartera de clientes y accionar estrategias de retención:
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/40">
          <span className="block font-extrabold text-blue-400 text-sm uppercase tracking-wider mb-1">R - Recencia</span>
          <span className="text-xs leading-relaxed text-slate-400">Días transcurridos desde su última orden. Menos días = mayor puntuación (activo).</span>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/40">
          <span className="block font-extrabold text-indigo-400 text-sm uppercase tracking-wider mb-1">F - Frecuencia</span>
          <span className="text-xs leading-relaxed text-slate-400">Número total de órdenes completadas. A mayor volumen = mayor lealtad.</span>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/40">
          <span className="block font-extrabold text-emerald-400 text-sm uppercase tracking-wider mb-1">M - Monetario</span>
          <span className="text-xs leading-relaxed text-slate-400">Suma total de compras pagadas. Clasifica a tus compradores de alto ticket.</span>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1">
        <span>🔹 Cada dimensión puntúa de 1 a 4.</span>
        <span>🔹 La suma genera un <strong>Score RFM (3 a 12)</strong>.</span>
        <span>🔹 Segmentos: <strong>VIP</strong> (10-12) | <strong>Leal</strong> (7-9) | <strong>Potencial</strong> (4-6) | <strong>En Riesgo</strong> (&lt;4).</span>
      </div>
    </CardContent>
  </Card>
);

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
      (resumen?.estadosOrdenes ?? []).map((estado) => {
        const nombreEstado = estado.estado ?? '';
        return {
          name: ESTADO_TRADUCCIONES[nombreEstado] || nombreEstado || (estado.estadoId ? `Estado ${estado.estadoId}` : 'Sin estado'),
          value: estado.cantidad,
          rawName: nombreEstado
        };
      }),
    [resumen?.estadosOrdenes]
  );

  const ventasMes = resumen?.ventasMes;
  const kpis = [
    {
      titulo: 'Ventas Totales (Mes)',
      valor: isLoadingResumen || !ventasMes ? 'Cargando...' : formatCurrency(ventasMes.total_ventas),
      tendencia: 'up' as const,
      icon: DollarSign,
      description: 'Ingresos pagados este mes',
      colorClass: 'bg-blue-600',
    },
    {
      titulo: 'Ticket Promedio',
      valor: isLoadingResumen || !ventasMes ? 'Cargando...' : formatCurrency(ventasMes.ticket_promedio),
      tendencia: 'up' as const,
      icon: ShoppingBag,
      description: 'Promedio por compra pagada',
      colorClass: 'bg-emerald-600',
    },
    {
      titulo: 'Tasa de Conversión',
      valor: isLoadingResumen ? 'Cargando...' : formatPercent(resumen?.tasaConversion ?? 0),
      tendencia: 'up' as const,
      icon: Percent,
      description: 'Carritos vs órdenes creadas',
      colorClass: 'bg-indigo-600',
    },
    {
      titulo: 'Carritos Abandonados',
      valor: isLoadingResumen ? 'Cargando...' : String(resumen?.carritosAbandonados ?? 0),
      tendencia: 'down' as const,
      icon: ShoppingCart,
      description: 'Carritos no procesados este mes',
      colorClass: 'bg-rose-600',
    },
  ];

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Tablero de Control</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Análisis comercial consolidado, comportamiento de inventario y segmentación de clientes.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm text-slate-500 text-xs font-semibold">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>Mes Actual: {MESES[new Date().getMonth()]} {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard 
            key={kpi.titulo} 
            titulo={kpi.titulo} 
            valor={kpi.valor} 
            tendencia={kpi.tendencia} 
            icon={kpi.icon}
            description={kpi.description}
            colorClass={kpi.colorClass}
          />
        ))}
      </div>

      {/* Main Charts Block */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-700">Ventas en el Tiempo</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="h-[320px] w-full min-w-0 pt-6">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasTiempo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip prefix="S/ " />} />
                  <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={0.1} fill="#3b82f6" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-700">Ingresos por Categoría (Top 5)</CardTitle>
              <Layers className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="h-[320px] w-full min-w-0 pt-6">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosCategorias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="nombre" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip prefix="S/ " />} />
                  <Bar dataKey="ingresos" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Block */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-base font-bold text-slate-700">Estados de Órdenes</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] w-full min-w-0 flex flex-col justify-center">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosOrdenes}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {estadosOrdenes.map((entry, index) => {
                      const color = ESTADO_COLORS[entry.rawName] || COLORS[index % COLORS.length];
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} órdenes`, 'Cantidad']} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40}
                    iconSize={10} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-700">Tendencia e Histórico de Ventas</CardTitle>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md tracking-wider">Histórico</span>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] w-full min-w-0 pt-6">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasTiempo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip prefix="S/ " />} />
                  <Line type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, stroke: '#ec4899', strokeWidth: 2, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartSurface>
          </CardContent>
        </Card>
      </div>

      {/* RFM Explanation Section */}
      <RFMExplanationCard />

      {/* RFM Customer Segment Table */}
      <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-5">
          <div>
            <CardTitle className="text-base font-bold text-slate-700">Clasificación RFM de Clientes</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Listado ordenado por valor de score. Datos transaccionales en tiempo real.</p>
          </div>
          <Users className="h-5 w-5 text-indigo-500" />
        </CardHeader>
        <CardContent className="p-0">
          {/* Vista de Tarjetas para Móviles */}
          <div className="grid grid-cols-1 gap-4 md:hidden p-4">
            {isLoadingResumen ? (
              <div className="text-center py-10 text-slate-400 font-medium">
                Cargando análisis RFM...
              </div>
            ) : (resumen?.rfmDatos ?? []).length > 0 ? (
              (resumen?.rfmDatos ?? []).map((cli) => (
                <div key={cli.cliente_id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{cli.razon_social || 'Consumidor Final'}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
                      cli.segmento_rfm === 'VIP' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : cli.segmento_rfm === 'Leal' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : cli.segmento_rfm === 'Potencial' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        cli.segmento_rfm === 'VIP' 
                          ? 'bg-emerald-500' 
                          : cli.segmento_rfm === 'Leal' 
                          ? 'bg-blue-500' 
                          : cli.segmento_rfm === 'Potencial' 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500'
                      }`} />
                      {cli.segmento_rfm}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs">Total Monetario:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(Number(cli.valor_monetario))}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-400 text-xs">Score:</span>
                      <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700">
                        {cli.score_rfm}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-2">
                    <span>{cli.frecuencia} {cli.frecuencia === 1 ? 'compra' : 'compras'}</span>
                    <span>
                      {cli.dias_desde_ultima_compra === 0 
                        ? 'Hoy' 
                        : cli.dias_desde_ultima_compra === 1 
                        ? 'Ayer' 
                        : `Hace ${cli.dias_desde_ultima_compra} días`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 font-medium text-sm">
                Se requieren órdenes en estados válidos para ver el análisis RFM.
              </div>
            )}
          </div>

          {/* Tabla de Datos (Visible solo en Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 text-center">Última Compra</th>
                  <th className="px-6 py-4 text-center">Frecuencia</th>
                  <th className="px-6 py-4 text-right">Total Monetario (S/)</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-500">R</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-500">F</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-500">M</th>
                  <th className="px-6 py-4 text-center font-bold text-indigo-600">Score</th>
                  <th className="px-6 py-4 text-center">Segmento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingResumen ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                      Cargando análisis RFM...
                    </td>
                  </tr>
                ) : (resumen?.rfmDatos ?? []).length > 0 ? (
                  (resumen?.rfmDatos ?? []).map((cli) => (
                    <tr key={cli.cliente_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {cli.razon_social || 'Consumidor Final'}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-medium">
                        {cli.dias_desde_ultima_compra === 0 
                          ? 'Hoy' 
                          : cli.dias_desde_ultima_compra === 1 
                          ? 'Ayer' 
                          : `Hace ${cli.dias_desde_ultima_compra} días`}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-bold">
                        {cli.frecuencia} {cli.frecuencia === 1 ? 'compra' : 'compras'}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-700">
                        {formatCurrency(Number(cli.valor_monetario))}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{cli.R}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{cli.F}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{cli.M}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700 min-w-8">
                          {cli.score_rfm}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm/5 border ${
                          cli.segmento_rfm === 'VIP' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : cli.segmento_rfm === 'Leal' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : cli.segmento_rfm === 'Potencial' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            cli.segmento_rfm === 'VIP' 
                              ? 'bg-emerald-500' 
                              : cli.segmento_rfm === 'Leal' 
                              ? 'bg-blue-500' 
                              : cli.segmento_rfm === 'Potencial' 
                              ? 'bg-indigo-500' 
                              : 'bg-rose-500'
                          }`} />
                          {cli.segmento_rfm}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                      Se requieren órdenes en estados válidos ('pagada', 'en_proceso', 'enviada', 'entregada') para ver el análisis RFM.
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

