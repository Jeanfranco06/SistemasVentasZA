// frontend/src/pages/admin/ReportsAdminPage.tsx
import { useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

const descargarPDF = async (url: string, nombreArchivo: string) => {
  try {
    toast.loading('Generando PDF, espere...', { id: 'pdf-loader' });
    const response = await api.get(url, { responseType: 'blob' });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute('download', `${nombreArchivo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.dismiss('pdf-loader');
    toast.success('PDF descargado');
  } catch (error) {
    toast.dismiss('pdf-loader');
    toast.error('Error al generar. Verifique los filtros.');
  }
};

export const ReportsAdminPage = () => {
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date().toISOString().split('T')[0], // Por defecto hoy
    fechaFin: new Date().toISOString().split('T')[0],
    ordenId: '' // Para facturas individuales
  });

  const generarUrl = (endpointBase: string) => {
    const params = new URLSearchParams({
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
    });
    return `${endpointBase}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Centro de Reportes y Análisis</h1>

      {/* PANEL DE FILTROS GLOBALES */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-700">Filtros de Generación</CardTitle>
          <CardDescription>Estos filtros se aplicarán a todos los reportes operativos y de gestión.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-blue-900">Fecha Inicio</Label>
              <Input type="date" value={filtros.fechaInicio} onChange={e => setFiltros({...filtros, fechaInicio: e.target.value})} />
            </div>
            <div>
              <Label className="text-blue-900">Fecha Fin</Label>
              <Input type="date" value={filtros.fechaFin} onChange={e => setFiltros({...filtros, fechaFin: e.target.value})} />
            </div>
            <div>
              <Label className="text-blue-900">ID Orden (Solo facturas)</Label>
              <Input type="number" placeholder="Ej: 15" value={filtros.ordenId} onChange={e => setFiltros({...filtros, ordenId: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reportes Operacionales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Reportes Operacionales</CardTitle>
            <CardDescription>Tablas detalladas de datos transaccionales (PDFKit).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {[
              { label: 'Órdenes del Período', endpoint: '/reportes/operacionales/ordenes', file: 'ordenes_periodo' },
              { label: 'Inventario Valorizado', endpoint: '/reportes/operacionales/inventario', file: 'inventario_valorizado' },
              { label: 'Movimientos de Inventario', endpoint: '/reportes/operacionales/movimientos', file: 'movimientos_inv' },
              { label: 'Stock Bajo / Agotado', endpoint: '/reportes/operacionales/stock-bajo', file: 'stock_bajo' },
              { label: 'Pagos Recibidos', endpoint: '/reportes/operacionales/pagos', file: 'pagos_recibidos' },
              { label: 'Devoluciones', endpoint: '/reportes/operacionales/devoluciones', file: 'devoluciones' },
            ].map(rep => (
              <Button key={rep.endpoint} variant="outline" className="justify-start h-auto py-3" onClick={() => descargarPDF(generarUrl(rep.endpoint), rep.file)}>
                📄 {rep.label}
              </Button>
            ))}
            
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground mb-2">Usa el campo "ID Orden" de los filtros arriba para facturas:</p>
              {[
                { label: 'Factura Individual', endpoint: `/reportes/operacionales/factura/${filtros.ordenId || '0'}`, file: `factura_${filtros.ordenId}` },
                { label: 'Comprobante Simplificado', endpoint: `/reportes/operacionales/comprobante/${filtros.ordenId || '0'}`, file: `comprobante_${filtros.ordenId}` },
              ].map(rep => (
                <Button 
                  key={rep.endpoint} 
                  variant="outline" 
                  className="justify-start h-auto py-3 w-full"
                  disabled={!filtros.ordenId} // Se deshabilita hasta que escribas un ID
                  onClick={() => descargarPDF(rep.endpoint, rep.file)} // Se llama directo, sin generarUrl
                >
                  🧾 {rep.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reportes de Gestión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-purple-800">Reportes de Gestión</CardTitle>
            <CardDescription>Análisis gráficos para toma de decisiones (Puppeteer).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {[
              { label: 'Rentabilidad por Producto', endpoint: '/reportes/gestion/rentabilidad', file: 'rentabilidad' },
              { label: 'Ventas Comparativas por Categoría', endpoint: '/reportes/gestion/ventas-categoria', file: 'ventas_cat' },
              { label: 'Análisis de Comportamiento de Carritos', endpoint: '/reportes/gestion/carritos', file: 'carritos' },
              { label: 'Segmentación y Comportamiento de Clientes', endpoint: '/reportes/gestion/clientes', file: 'clientes' },
              { label: 'Rotación de Inventario', endpoint: '/reportes/gestion/rotacion', file: 'rotacion' },
              { label: 'Ingresos vs Costos (P&L)', endpoint: '/reportes/gestion/ingresos-costos', file: 'ingresos_costos' },
            ].map(rep => (
              <Button key={rep.endpoint} variant="outline" className="justify-start h-auto py-3 border-purple-200 hover:bg-purple-50 text-purple-900" onClick={() => descargarPDF(generarUrl(rep.endpoint), rep.file)}>
                📊 {rep.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};