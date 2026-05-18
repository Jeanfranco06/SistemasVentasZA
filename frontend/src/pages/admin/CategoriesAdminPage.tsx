// frontend/src/pages/admin/CategoriesAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, flexRender, getPaginationRowModel } from '@tanstack/react-table';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { 
  Tag, 
  Plus, 
  Edit3, 
  EyeOff, 
  Loader2, 
  Sparkles 
} from 'lucide-react';

type CategoriaRow = { id: number; nombre: string; prefijoSku: string; activo: boolean };

export const CategoriesAdminPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<CategoriaRow | null>(null);
  const [formData, setFormData] = useState({ nombre: '', prefijoSku: '' });

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: async () => { 
      const { data } = await api.get('/categorias/admin'); 
      return data.data; 
    }
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
    onSuccess: () => { 
      toast.success('Categoría desactivada'); 
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] }); 
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al desactivar')
  });

  const abrirModalParaCrear = () => { 
    setEditando(null); 
    setFormData({ nombre: '', prefijoSku: '' }); 
    setModalOpen(true); 
  };
  
  const abrirModalParaEditar = (cat: CategoriaRow) => { 
    setEditando(cat); 
    setFormData({ nombre: cat.nombre, prefijoSku: cat.prefijoSku }); 
    setModalOpen(true); 
  };
  
  const cerrarModal = () => { 
    setModalOpen(false); 
    setEditando(null); 
  };

  const columns: ColumnDef<CategoriaRow>[] = [
    {
      accessorKey: 'prefijoSku',
      header: 'Prefijo SKU',
      cell: info => (
        <span className="font-mono font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200/50">
          {String(info.getValue() ?? '')}
        </span>
      )
    },
    { 
      accessorKey: 'nombre', 
      header: 'Nombre de Categoría',
      cell: info => <span className="font-semibold text-slate-800">{String(info.getValue() ?? '')}</span>
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: info => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${info.getValue() ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {info.getValue() ? 'ACTIVO' : 'INACTIVO'}
        </span>
      )
    },
    {
      id: 'acciones', 
      header: 'Acciones', 
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => abrirModalParaEditar(row.original)} 
            disabled={!row.original.activo}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow"
          >
            <Edit3 className="h-3.5 w-3.5 text-blue-500" />
            <span>Editar</span>
          </Button>
          {row.original.activo && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                if (window.confirm(`¿Desea desactivar la categoría ${row.original.nombre}?`)) {
                  eliminarMutation.mutate(row.original.id);
                }
              }}
              className="rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Desactivar</span>
            </Button>
          )}
        </div>
      )
    }
  ];

  const table = useReactTable({ 
    data: categorias || [], 
    columns, 
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-6 w-full mx-auto p-4 md:p-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Categorías Comerciales</h1>
          </div>
          <p className="text-emerald-100/90 text-sm max-w-xl">
            Crea y administra las categorías de productos que definen la estructura de tu tienda y determinan los prefijos autogenerados de SKU.
          </p>
        </div>

        <Button
          onClick={abrirModalParaCrear}
          className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-xl px-5 py-6 h-auto self-start md:self-auto relative z-10"
        >
          <Plus className="mr-2 h-5 w-5" /> Nueva Categoría
        </Button>
      </div>

      {/* Vista de Tarjetas para Móviles */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="text-sm font-medium">Cargando categorías...</span>
            </div>
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <Tag className="h-10 w-10 text-slate-300" />
              <span className="text-sm font-medium">No se encontraron categorías registradas</span>
            </div>
          </div>
        ) : (
          table.getRowModel().rows.map(row => {
            const cat = row.original;
            return (
              <div key={row.id} className={`bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 ${!cat.activo ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{cat.nombre}</span>
                    <span className="font-mono text-xs text-slate-400">Prefijo: {cat.prefijoSku}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cat.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {cat.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => abrirModalParaEditar(cat)} 
                    disabled={!cat.activo}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow text-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Editar</span>
                  </Button>
                  {cat.activo && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        if (window.confirm(`¿Desea desactivar la categoría ${cat.nombre}?`)) {
                          eliminarMutation.mutate(cat.id);
                        }
                      }}
                      className="rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow text-xs"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Desactivar</span>
                    </Button>
                  )}
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
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {table.getHeaderGroups()[0].headers.map(h => (
                  <th key={h.id} className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      <span className="text-sm font-medium">Cargando categorías comerciales...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tag className="h-10 w-10 text-slate-300" />
                      <span className="text-sm font-medium">No se encontraron categorías registradas</span>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/50 border-b border-slate-50 transition-colors duration-200 ${!row.original.activo ? 'bg-slate-50/30 opacity-60' : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-6 align-middle">
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

      {/* MODAL DE CREAR/EDITAR */}
      <Dialog open={modalOpen} onOpenChange={cerrarModal}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden p-6">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              <span>{editando ? 'Editar Categoría' : 'Nueva Categoría'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Nombre de la Categoría</Label>
              <Input 
                value={formData.nombre} 
                onChange={e => setFormData({...formData, nombre: e.target.value})} 
                placeholder="Ej: Electrónica, Moda, Hogar..." 
                className="border-slate-200 focus-visible:ring-emerald-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Prefijo SKU (3 Letras Mayúsculas)</Label>
              <Input 
                value={formData.prefijoSku} 
                onChange={e => setFormData({...formData, prefijoSku: e.target.value.toUpperCase()})} 
                placeholder="Ej: ELE, MOD, HOG..."
                maxLength={3}
                className="uppercase border-slate-200 focus-visible:ring-emerald-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5 font-mono font-bold"
              />
              <p className="text-xs text-slate-400">Este prefijo se utilizará automáticamente al generar códigos de SKU de los productos.</p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex gap-2">
            <Button variant="outline" onClick={cerrarModal} className="rounded-xl border-slate-200">
              Cancelar
            </Button>
            <Button 
              onClick={() => guardarMutation.mutate(formData)} 
              disabled={guardarMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow font-semibold"
            >
              {guardarMutation.isPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : (
                'Guardar Categoría'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};