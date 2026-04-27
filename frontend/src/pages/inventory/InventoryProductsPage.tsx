// frontend/src/pages/inventory/InventoryProductsPage.tsx
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

export const InventoryProductsPage = () => {
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
    mutationFn: async ({ id, estadoActual }: { id: number; estadoActual: string }) => {
      const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
      const { data } = await api.patch(`/productos/${id}/estado`, { estado: nuevoEstado });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-productos'] });
      toast.success('Estado del producto actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado del producto');
    }
  });

  // 4. Configuración de TanStack Table
  const columns: ColumnDef<ProductoRow>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: info => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{info.getValue() as string}</span>
    },
    { accessorKey: 'nombre', header: 'Nombre' },
    {
      accessorKey: 'categoria.nombre',
      header: 'Categoría',
      cell: info => <span>{info.getValue() as string}</span>
    },
    {
      accessorKey: 'precioCosto',
      header: 'Costo',
      cell: info => <span>S/ {Number(info.getValue()).toFixed(2)}</span>
    },
    {
      accessorKey: 'precioVenta',
      header: 'Venta',
      cell: info => <span>S/ {Number(info.getValue()).toFixed(2)}</span>
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: info => {
        const estado = info.getValue() as string;
        return (
          <Badge variant={estado === 'activo' ? 'default' : 'secondary'}>
            {estado === 'activo' ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/inventario/productos/editar/${row.original.id}`)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant={row.original.estado === 'activo' ? 'destructive' : 'default'}
            onClick={() => toggleEstadoMutation.mutate({
              id: row.original.id,
              estadoActual: row.original.estado
            })}
            disabled={toggleEstadoMutation.isPending}
          >
            {row.original.estado === 'activo' ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600">Cargando productos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-2">Gestiona el inventario de productos</p>
        </div>
        <Button onClick={() => navigate('/inventario/productos/nuevo')}>
          Nuevo Producto
        </Button>
      </div>

      {/* Filtro de búsqueda */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay productos disponibles</p>
        </div>
      )}
    </div>
  );
};