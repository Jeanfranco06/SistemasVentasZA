// frontend/src/pages/admin/ProductsAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Tipado de la fila de la tabla
type ProductoRow = {
  id: number;
  sku: string;
  nombre: string;
  categoria: { nombre: string };
  precioCosto: number;
  precioVenta: number;
  estado: string;
};

type ProductosAdminResponse = {
  total: number;
  data: ProductoRow[];
};

export const ProductsAdminPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');

  // 1. Obtener productos (Incluyendo borradores e inactivos, a diferencia de la tienda)
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
      accessorKey: 'sku',
      header: 'SKU',
      cell: info => <span className="font-mono text-xs">{String(info.getValue() ?? '')}</span>
    },
    { accessorKey: 'nombre', header: 'Nombre del Producto' },
    { accessorKey: 'categoria.nombre', header: 'Categoría' },
    { 
      accessorKey: 'precioCosto', 
      header: 'P. Costo',
      cell: info => `S/ ${parseFloat(info.getValue() as string).toFixed(2)}`
    },
    { 
      accessorKey: 'precioVenta', 
      header: 'P. Venta',
      cell: info => <span className="font-bold">S/ {parseFloat(info.getValue() as string).toFixed(2)}</span>
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: info => {
        const estado = info.getValue() as string;
        const variant = estado === 'activo' ? 'bg-green-100 text-green-800' : estado === 'borrador' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800';
        return <span className={`px-2 py-1 rounded text-xs font-medium ${variant}`}>{estado}</span>;
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const esInactivo = row.original.estado === 'inactivo';
        const textoAccion = esInactivo ? 'Activar' : 'Desactivar';
        const confirmacion = esInactivo
          ? `¿Activar ${row.original.nombre}?`
          : `¿Desactivar ${row.original.nombre}?`;

        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/productos/editar/${row.original.id}`)}>
              ✏️ Editar
            </Button>
            <Button
              variant={esInactivo ? 'default' : 'destructive'}
              size="sm"
              onClick={() => {
                if (window.confirm(confirmacion)) {
                  toggleEstadoMutation.mutate({ id: row.original.id, estado: row.original.estado });
                }
              }}
            >
              {esInactivo ? '✅ Activar' : '🗑️ Desactivar'}
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
    // getPaginationRowModel: getPaginationRowModel(), // Se puede añadir si se quiere paginar del lado del cliente
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Productos (CRUD)</h1>
        <Button onClick={() => navigate('/admin/productos/nuevo')}>
          + Crear Nuevo Producto
        </Button>
      </div>

      {/* Barra de Búsqueda Global */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar por SKU o Nombre..."
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-gray-500">{data?.total || 0} productos encontrados</span>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-lg shadow border">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-3 font-medium text-gray-600">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando datos...</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No se encontraron productos</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${row.original.estado === 'inactivo' ? 'opacity-50 bg-gray-50 line-through' : ''}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
