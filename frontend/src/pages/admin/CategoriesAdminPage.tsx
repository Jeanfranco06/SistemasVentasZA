// frontend/src/pages/admin/CategoriesAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';


type CategoriaRow = { id: number; nombre: string; prefijoSku: string; activo: boolean };

export const CategoriesAdminPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<CategoriaRow | null>(null);
  const [formData, setFormData] = useState({ nombre: '', prefijoSku: '' });

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: async () => { const { data } = await api.get('/categorias/admin'); return data.data; }
  });

  const guardarMutation = useMutation({
    mutationFn: (data: any) => {
      if (editando) return api.put(`/categorias/${editando.id}`, data);
      return api.post('/categorias', data);
    },
    onSuccess: () => {
      toast.success(editando ? 'Categoría actualizada' : 'Categoría creada');
      cerrarModal();
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar')
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categorias/${id}`),
    onSuccess: () => { toast.success('Eliminada'); queryClient.invalidateQueries({ queryKey: ['admin-categorias'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al eliminar (Puede tener productos asociados)')
  });

  const abrirModalParaCrear = () => { setEditando(null); setFormData({ nombre: '', prefijoSku: '' }); setModalOpen(true); };
  const abrirModalParaEditar = (cat: CategoriaRow) => { setEditando(cat); setFormData({ nombre: cat.nombre, prefijoSku: cat.prefijoSku }); setModalOpen(true); };
  const cerrarModal = () => { setModalOpen(false); setEditando(null); };

  const columns: ColumnDef<CategoriaRow>[] = [
    {
      accessorKey: 'prefijoSku',
      header: 'Prefijo SKU',
      cell: info => (
        <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">
          {String(info.getValue() ?? '')}
        </span>
      )
    },
    { accessorKey: 'nombre', header: 'Nombre de Categoría' },
    {
        id: 'acciones', header: 'Acciones', cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => abrirModalParaEditar(row.original)} disabled={!row.original.activo}>
              ✏️
            </Button>
            {row.original.activo && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  if(window.confirm(`¿Desactivar ${row.original.nombre}?`)) {
                    eliminarMutation.mutate(row.original.id);
                  }
                }}
              >
                🚫
              </Button>
            )}
          </div>
        )
      },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: info => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'} className={info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    }
  ];

  const table = useReactTable({ data: categorias || [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        <Button onClick={abrirModalParaCrear}>+ Nueva Categoría</Button>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 border-b"><tr>{table.getHeaderGroups()[0].headers.map(h => <th key={h.id} className="px-6 py-3">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr></thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="text-center py-10">Cargando...</td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`border-b hover:bg-gray-50 ${!row.original.activo ? 'opacity-50 bg-gray-50 line-through' : ''}`}
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

      {/* MODAL DE CREAR/EDITAR */}
      <Dialog open={modalOpen} onOpenChange={cerrarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre</Label>
              <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Electrónica" />
            </div>
            <div>
              <Label>Prefijo SKU (3 letras mayúsculas)</Label>
              <Input 
                value={formData.prefijoSku} 
                onChange={e => setFormData({...formData, prefijoSku: e.target.value.toUpperCase()})} 
                placeholder="EJ: ELE"
                maxLength={3}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">Este prefijo se usará para autogenerar los SKUs de los productos.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button onClick={() => guardarMutation.mutate(formData)} disabled={guardarMutation.isPending}>
              {guardarMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};