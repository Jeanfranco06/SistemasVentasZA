// frontend/src/pages/admin/ReportsAdminPage.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { 
  FileBarChart2, 
  Calendar, 
  TrendingUp, 
  Layers, 
  PieChart, 
  Database, 
  Download, 
  Sliders, 
  Sparkles, 
  Loader2 
} from 'lucide-react';

export const ReportsAdminPage = () => {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [fechaInicio, setFechaInicio] = useState(getTodayDateString());
  const [fechaFin, setFechaFin] = useState(getTodayDateString());
  const [ordenId, setOrdenId] = useState('');
  const [descargando, setDescargando] = useState<string | null>(null);

  // Obtener órdenes de compra registradas para el selector de ficha detallada
  const { data: ordenes } = useQuery({
    queryKey: ['reportes-ordenes'],
    queryFn: async () => {
      const { data } = await api.get('/ordenes/admin');
      return data.data;
    }
  });

  // Poner por defecto fechas de inicio y fin según los datos que existen realmente
  useEffect(() => {
    if (ordenes && ordenes.length > 0) {
      const dates = ordenes.map((o: any) => new Date(o.fechaCreacion));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setFechaInicio(formatDate(minDate));
      setFechaFin(formatDate(maxDate));
    }
  }, [ordenes]);

  const handleDescarga = async (endpoint: string, reportName: string, params: Record<string, string> = {}) => {
    try {
      setDescargando(reportName);
      toast.loading(`Generando y compilando ${reportName}...`, { id: 'descarga-pdf' });
      
      const token = useAuthStore.getState().accessToken;
      const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin + '/api/v1';

      // Convertir params a query string
      const queryString = new URLSearchParams(params).toString();
      const urlCompleta = `${apiBaseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(urlCompleta, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error en la generación del PDF por parte del servidor');
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(fileUrl);
      
      toast.dismiss('descarga-pdf');
      toast.success(`${reportName} generado y descargado correctamente.`);
    } catch (err: any) {
      toast.dismiss('descarga-pdf');
      toast.error(err.message || 'Error al compilar el reporte PDF');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto p-4 md:p-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
              <FileBarChart2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Centro de Reportes</h1>
          </div>
          <p className="text-violet-100/90 text-sm max-w-xl">
            Genera documentos oficiales del sistema. Combina consultas estructuradas vía PDFKit con gráficos analíticos renderizados en tiempo real mediante Puppeteer.
          </p>
        </div>
      </div>

      {/* Panel de Filtros Globales */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-md rounded-2xl p-5 space-y-4">
        <h2 className="text-slate-800 font-bold text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <Sliders className="h-4 w-4 text-violet-500" />
          <span>Filtros y Parámetros de Generación</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold text-xs flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Fecha de Inicio</span>
            </Label>
            <Input 
              type="date" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)}
              className="border-slate-200 focus-visible:ring-violet-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5 font-semibold text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold text-xs flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Fecha Fin</span>
            </Label>
            <Input 
              type="date" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)}
              className="border-slate-200 focus-visible:ring-violet-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5 font-semibold text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold text-xs flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Orden de Compra Específica</span>
            </Label>
            <select 
              value={ordenId} 
              onChange={e => setOrdenId(e.target.value)}
              className="w-full border border-slate-250 rounded-xl bg-slate-50/50 px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold text-slate-750 text-sm"
            >
              <option value="">-- Seleccionar Orden (Ficha Auditoría) --</option>
              {ordenes?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.codigoOrden} ({o.cliente?.razonSocial || 'Consumidor Final'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reportes por Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reportes Operacionales */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-slate-800 font-extrabold text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500 animate-pulse" />
              <span>Reportes Operacionales</span>
            </h2>
            <span className="text-xxs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-150">PDFKIT</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Reportes financieros y de inventario estructurados de generación inmediata. Útiles para auditorías comerciales rápidas.
          </p>

          <div className="space-y-3 pt-2">
            
            {/* Tarjeta Stock */}
            <div className="bg-slate-50/50 border border-slate-100 hover:border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Alertas de Stock Bajo</h3>
                <p className="text-xxs text-slate-400 font-medium">Listado de productos con stock menor o igual al mínimo.</p>
              </div>
              <Button
                onClick={() => handleDescarga('/reportes/operacionales/stock-bajo', 'Reporte Stock')}
                disabled={!!descargando}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow font-semibold text-xs px-4"
              >
                {descargando === 'Reporte Stock' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>

            {/* Tarjeta Inventario Valorizado */}
            <div className="bg-slate-50/50 border border-slate-100 hover:border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Inventario Comercial Valorizado</h3>
                <p className="text-xxs text-slate-400 font-medium">Cálculo del valor total comercializado del almacén (Costo vs Venta).</p>
              </div>
              <Button
                onClick={() => handleDescarga('/reportes/operacionales/inventario', 'Valorizacion Inventario')}
                disabled={!!descargando}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow font-semibold text-xs px-4"
              >
                {descargando === 'Valorizacion Inventario' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>

            {/* Tarjeta Pagos del Mes */}
            <div className="bg-slate-50/50 border border-slate-100 hover:border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Auditoría de Pagos del Mes</h3>
                <p className="text-xxs text-slate-400 font-medium">Pagos y conciliaciones entre {fechaInicio} y {fechaFin}.</p>
              </div>
              <Button
                onClick={() => handleDescarga('/reportes/operacionales/pagos', 'Pagos Mes', { fechaInicio, fechaFin })}
                disabled={!!descargando}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow font-semibold text-xs px-4"
              >
                {descargando === 'Pagos Mes' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>

          </div>
        </div>

        {/* Reportes de Gestión */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-slate-800 font-extrabold text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500 animate-pulse" />
              <span>Análisis de Gestión y Estrategia</span>
            </h2>
            <span className="text-xxs font-bold bg-violet-50 text-violet-755 px-2 py-0.5 rounded-full border border-violet-150">PUPPETEER</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Reportes avanzados enriquecidos con gráficos dinámicos de barras y líneas generados mediante la renderización del servidor.
          </p>

          <div className="space-y-3 pt-2">
            
            {/* Tarjeta Rentabilidad */}
            <div className="bg-slate-50/50 border border-slate-100 hover:border-violet-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Rentabilidad, Pérdidas y Ganancias</h3>
                <p className="text-xxs text-slate-400 font-medium">Margen neto de utilidad entre {fechaInicio} y {fechaFin}.</p>
              </div>
              <Button
                onClick={() => handleDescarga('/reportes/gestion/rentabilidad', 'Rentabilidad Corporativa', { fechaInicio, fechaFin })}
                disabled={!!descargando}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow font-semibold text-xs px-4"
              >
                {descargando === 'Rentabilidad Corporativa' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>

            {/* Tarjeta Carritos Abandonados */}
            <div className="bg-slate-50/50 border border-slate-100 hover:border-violet-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Análisis de Carritos Abandonados</h3>
                <p className="text-xxs text-slate-400 font-medium">Conversión y comportamiento de carritos en el rango seleccionado.</p>
              </div>
              <Button
                onClick={() => handleDescarga('/reportes/gestion/carritos', 'Comportamiento Carts', { fechaInicio, fechaFin })}
                disabled={!!descargando}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow font-semibold text-xs px-4"
              >
                {descargando === 'Comportamiento Carts' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>

            {/* Tarjeta Ficha Orden Detallada */}
            <div className={`border rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 ${ordenId ? 'bg-slate-50/50 border-slate-100 hover:border-violet-200 hover:shadow-sm' : 'bg-slate-50/20 border-slate-100 opacity-60'}`}>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Ficha Detallada de Orden Comercial</h3>
                <p className="text-xxs text-slate-400 font-medium">
                  {ordenId ? 'Listo para generar ficha con auditoría comercial' : 'Selecciona una orden en el filtro superior para habilitar este reporte'}
                </p>
              </div>
              <Button
                onClick={() => handleDescarga(`/reportes/operacionales/factura/${ordenId}`, 'Ficha Orden Detallada')}
                disabled={!ordenId || !!descargando}
                className={`text-white rounded-lg shadow font-semibold text-xs px-4 ${ordenId ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                {descargando === 'Ficha Orden Detallada' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};