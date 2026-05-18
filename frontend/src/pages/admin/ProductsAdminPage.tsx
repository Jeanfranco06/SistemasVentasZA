// frontend/src/pages/admin/ProductsAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, flexRender, getPaginationRowModel } from '@tanstack/react-table';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Sparkles 
} from 'lucide-react';

// Tipado de la fila de la tabla
type ProductoRow = {
  id: number;
  sku: string;
  nombre: string;
  categoria: { nombre: string };
  precioCosto: number;
  precioVenta: number;
  estado: string;
  catImagenesProducto?: Array<{ urlImagen: string; orden: number }>;
};

type ProductosAdminResponse = {
  total: number;
  data: ProductoRow[];
};

export const ProductsAdminPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');

  // 1. Obtener productos (Incluyendo borradores e inactivos)
  const { data, isLoading } = useQuery<ProductosAdminResponse>({
    queryKey: ['admin-productos', globalFilter],
    queryFn: async () => {
      const { data } = await api.get('/productos/admin', { params: { busqueda: globalFilter } });
      const payload = data.data;
      if (Array.isArray(payload)) {
        return { total: payload.length, data: payload };
      }
      return {
        total: payload?.total ?? 0,
        data: Array.isArray(payload?.data) ? payload.data : [],
      };
    }
  });

  // 2. Mutación para activar / desactivar según el estado actual
  const toggleEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) => {
      if (estado === 'inactivo') {
        return api.put(`/productos/${id}`, { estado: 'activo', activo: true });
      }
      return api.delete(`/productos/${id}`);
    },
    onSuccess: () => {
      toast.success('Estado del producto actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-productos'] });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message;
      if (err.response?.status === 400 && message) {
        toast.error(message, { duration: 5000, icon: '🚫' });
      } else {
        toast.error('Error al actualizar el estado del producto');
      }
    }
  });

  // 3. Definición de Columnas (TanStack Table v8)
  const columns: ColumnDef<ProductoRow>[] = [
    {
      id: 'imagen',
      header: 'Imagen',
      cell: function ImageCell({ row }) {
        const [imageError, setImageError] = useState(false);
        const imagenes = row.original.catImagenesProducto;
        const imagenPrincipal = imagenes?.find(img => img.orden === 0) || imagenes?.[0];
        
        if (!imagenPrincipal || imageError) {
          return (
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <Package className="h-5 w-5" />
            </div>
          );
        }
        
        // Construir URL de la imagen
        let urlImagen = imagenPrincipal.urlImagen;
        if (!urlImagen.startsWith('http') && !urlImagen.startsWith('/api')) {
          const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin + '/api/v1';
          const baseUrl = apiBaseUrl.replace('/api/v1', '');
          urlImagen = baseUrl + urlImagen;
        }
        
        return (
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 hover:scale-105 transition-transform duration-200">
            <img 
              src={urlImagen} 
              alt={row.original.nombre}
              className="w-full h-full object-cover"
              onError={() => {
                console.error('Error cargando imagen:', urlImagen);
                setImageError(true);
              }}
            />
          </div>
        );
      }
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: info => (
        <span className="font-mono text-xs font-semibold bg-slate-100/80 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200/50">
          {String(info.getValue() ?? '')}
        </span>
      )
    },
    { 
      accessorKey: 'nombre', 
      header: 'Nombre del Producto',
      cell: info => <span className="font-semibold text-slate-800">{String(info.getValue() ?? '')}</span>
    },
    { 
      accessorKey: 'categoria.nombre', 
      header: 'Categoría',
      cell: info => <span className="text-slate-600 font-medium">{String(info.getValue() ?? 'Sin categoría')}</span>
    },
    { 
      accessorKey: 'precioCosto', 
      header: 'P. Costo',
      cell: info => <span className="text-slate-500 font-medium">S/ {parseFloat(info.getValue() as string).toFixed(2)}</span>
    },
    { 
      accessorKey: 'precioVenta', 
      header: 'P. Venta',
      cell: info => (
        <span className="font-bold text-slate-900 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100/50">
          S/ {parseFloat(info.getValue() as string).toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: info => {
        const estado = info.getValue() as string;
        let variantClass = '';
        if (estado === 'activo') {
          variantClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (estado === 'borrador') {
          variantClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else {
          variantClass = 'bg-rose-50 text-rose-700 border-rose-200';
        }
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${variantClass}`}>
            {estado.toUpperCase()}
          </span>
        );
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const esInactivo = row.original.estado === 'inactivo';
        const confirmacion = esInactivo
          ? `¿Desea activar el producto ${row.original.nombre}?`
          : `¿Desea desactivar el producto ${row.original.nombre}?`;

        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/admin/productos/editar/${row.original.id}`)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-500" />
              <span>Editar</span>
            </Button>
            <Button
              variant={esInactivo ? 'default' : 'destructive'}
              size="sm"
              onClick={() => {
                if (window.confirm(confirmacion)) {
                  toggleEstadoMutation.mutate({ id: row.original.id, estado: row.original.estado });
                }
              }}
              className="rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow"
            >
              {esInactivo ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Activar</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Desactivar</span>
                </>
              )}
            </Button>
          </div>
        );
      }
    }
  ];

  // 4. Instancia de la Tabla
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  return (
    <div className="space-y-6 w-full mx-auto p-4 md:p-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestión de Productos</h1>
          </div>
          <p className="text-blue-100/90 text-sm max-w-xl">
            Administra el catálogo completo de productos, activa o desactiva items comerciales y controla los precios base.
          </p>
        </div>

        <Button
          onClick={() => navigate('/admin/productos/nuevo')}
          className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-xl px-5 py-6 h-auto self-start md:self-auto relative z-10"
        >
          <Plus className="mr-2 h-5 w-5" /> Crear Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-md rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por SKU o Nombre..."
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-10 pr-4 py-6 border-slate-200 focus-visible:ring-blue-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all w-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl self-start md:self-auto font-medium">
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>{data?.total || 0} productos registrados</span>
        </div>
      </div>

      {/* Vista de Tarjetas para Móviles */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Cargando inventario comercial...</span>
            </div>
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <Package className="h-10 w-10 text-slate-300" />
              <span className="text-sm font-medium">No se encontraron productos registrados</span>
            </div>
          </div>
        ) : (
          table.getRowModel().rows.map(row => {
            const prod = row.original;
            const esInactivo = prod.estado === 'inactivo';
            const confirmacion = esInactivo
              ? `¿Desea activar el producto ${prod.nombre}?`
              : `¿Desea desactivar el producto ${prod.nombre}?`;
            
            // Imagen logic
            const imagenPrincipal = prod.catImagenesProducto?.[0];
            let urlImagen = '/placeholder.png'; // Fallback
            if (imagenPrincipal) {
              urlImagen = imagenPrincipal.urlImagen;
              if (!urlImagen.startsWith('http') && !urlImagen.startsWith('/api')) {
                const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin + '/api/v1';
                const baseUrl = apiBaseUrl.replace('/api/v1', '');
                urlImagen = baseUrl + urlImagen;
              }
            }

            return (
              <div key={row.id} className={`bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 ${esInactivo ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex-shrink-0">
                    <img 
                      src={urlImagen} 
                      alt={prod.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{prod.nombre}</h3>
                    <p className="text-xs text-slate-500 font-medium truncate">{prod.categoria?.nombre || 'Sin categoría'}</p>
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">SKU: {prod.sku}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">Precio Venta:</span>
                    <span className="font-bold text-slate-900 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/50 text-sm">
                      S/ {Number(prod.precioVenta).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      prod.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      prod.estado === 'borrador' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {prod.estado.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/admin/productos/editar/${prod.id}`)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant={esInactivo ? 'default' : 'destructive'}
                    size="sm"
                    onClick={() => {
                      if (window.confirm(confirmacion)) {
                        toggleEstadoMutation.mutate({ id: prod.id, estado: prod.estado });
                      }
                    }}
                    className="rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow text-xs"
                  >
                    {esInactivo ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Activar</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Desactivar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla de Datos (Visible solo en Desktop) */}
      <div className="hidden md:block bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-100 bg-slate-50/70">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="text-sm font-medium">Cargando inventario comercial...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-10 w-10 text-slate-300" />
                      <span className="text-sm font-medium">No se encontraron productos registrados</span>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => {
                  const esInactivo = row.original.estado === 'inactivo';
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/50 border-b border-slate-50 transition-colors duration-200 ${esInactivo ? 'bg-slate-50/30 opacity-70' : ''}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-slate-100 shadow-md rounded-2xl p-4 mt-4">
        <div className="text-sm text-slate-500 font-medium">
          Mostrando página <span className="text-slate-800">{table.getState().pagination.pageIndex + 1}</span> de <span className="text-slate-800">{table.getPageCount()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

