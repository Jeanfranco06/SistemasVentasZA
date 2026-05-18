// frontend/src/pages/admin/ProvidersAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, flexRender, getPaginationRowModel } from '@tanstack/react-table';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { 
  Truck, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  AlertTriangle, 
  Loader2, 
  Sparkles 
} from 'lucide-react';

type ProveedorRow = { 
  id: number; 
  ruc: string; 
  razonSocial: string; 
  contacto: string | null; 
};

export const ProvidersAdminPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ProveedorRow | null>(null);
  const [formData, setFormData] = useState({ ruc: '', razonSocial: '', contacto: '' });
  const [errores, setErrores] = useState<{ruc?: string, razonSocial?: string}>({});

  // 1. Obtener proveedores
  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['admin-proveedores'],
    queryFn: async () => { 
      const { data } = await api.get('/inventario/proveedores'); 
      return data.data; 
    }
  });

  // 2. Mutación para Crear/Actualizar
  const guardarMutation = useMutation({
    mutationFn: (data: any) => {
      if (editando) return api.put(`/inventario/proveedores/${editando.id}`, data);
      return api.post('/inventario/proveedores', data);
    },
    onSuccess: () => { 
      toast.success(editando ? 'Proveedor actualizado' : 'Proveedor registrado'); 
      cerrarModal(); 
      queryClient.invalidateQueries({ queryKey: ['admin-proveedores'] }); 
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar')
  });

  // 3. Mutación para Eliminar Físicamente
  const eliminarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/inventario/proveedores/${id}`),
    onSuccess: () => { 
      toast.success('Proveedor eliminado del sistema'); 
      queryClient.invalidateQueries({ queryKey: ['admin-proveedores'] }); 
    },
    onError: (err: any) => { 
      toast.error(err.response?.data?.message || 'Error al eliminar al proveedor', { 
        duration: 6000,
        icon: '🚫'
      }); 
    }
  });

  // Funciones de UI del Modal
  const abrirCrear = () => { 
    setEditando(null); 
    setFormData({ ruc: '', razonSocial: '', contacto: '' }); 
    setErrores({}); 
    setModalOpen(true); 
  };
  
  const abrirEditar = (p: ProveedorRow) => { 
    setEditando(p); 
    setFormData({ ruc: p.ruc, razonSocial: p.razonSocial, contacto: p.contacto || '' }); 
    setErrores({}); 
    setModalOpen(true); 
  };
  
  const cerrarModal = () => setModalOpen(false);

  // Validaciones de formulario
  const validarFormulario = () => {
    let valido = true;
    const nuevosErrores: {ruc?: string, razonSocial?: string} = {};

    if (!/^\d{11}$/.test(formData.ruc)) {
      nuevosErrores.ruc = 'El RUC debe tener exactamente 11 dígitos numéricos.';
      valido = false;
    }
    if (formData.razonSocial.trim().length < 3) {
      nuevosErrores.razonSocial = 'La razón social es obligatoria (mín. 3 caracteres).';
      valido = false;
    }

    setErrores(nuevosErrores);
    return valido;
  };

  const handleGuardar = () => {
    if (validarFormulario()) {
      guardarMutation.mutate(formData);
    }
  };

  // Configuración de TanStack Table
  const columns: ColumnDef<ProveedorRow>[] = [
    {
      accessorKey: 'ruc',
      header: 'RUC',
      cell: info => (
        <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1.5 rounded-lg text-slate-700 border border-slate-200/50">
          {String(info.getValue())}
        </span>
      )
    },
    { 
      accessorKey: 'razonSocial', 
      header: 'Razón Social',
      cell: info => <span className="font-semibold text-slate-800">{String(info.getValue())}</span>
    },
    {
      accessorKey: 'contacto',
      header: 'Información de Contacto',
      cell: info => {
        const contacto = info.getValue() as string;
        if (!contacto) {
          return <span className="text-slate-400 italic text-xs">Sin contacto registrado</span>;
        }
        
        const esEmail = contacto.includes('@');
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {esEmail ? <Mail className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
            {contacto}
          </span>
        );
      }
    },
    { 
      id: 'acciones', 
      header: 'Acciones', 
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => abrirEditar(row.original)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow"
          >
            <Edit2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Editar</span>
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              if (window.confirm(`¿Está seguro de eliminar permanentemente a ${row.original.razonSocial}?`)) {
                eliminarMutation.mutate(row.original.id);
              }
            }}
            disabled={eliminarMutation.isPending}
            className="rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar</span>
          </Button>
        </div>
      )
    }
  ];

  const table = useReactTable({ 
    data: proveedores || [], 
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
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Proveedores y Logística</h1>
          </div>
          <p className="text-blue-100/90 text-sm max-w-xl">
            Registra y administra las identidades fiscales de tus proveedores. Ten en cuenta que la eliminación física se bloqueará si existen órdenes de compra asociadas.
          </p>
        </div>

        <Button
          onClick={abrirCrear}
          className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-xl px-5 py-6 h-auto self-start md:self-auto relative z-10"
        >
          <Plus className="mr-2 h-5 w-5" /> Registrar Proveedor
        </Button>
      </div>

      {/* Vista de Tarjetas para Móviles */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-650" />
              <span className="text-sm font-medium">Cargando proveedores...</span>
            </div>
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <Truck className="h-10 w-10 text-slate-300" />
              <span className="text-sm font-medium">No se encontraron proveedores registrados</span>
            </div>
          </div>
        ) : (
          table.getRowModel().rows.map(row => {
            const prov = row.original;
            return (
              <div key={row.id} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{prov.razonSocial}</span>
                    <span className="font-mono text-xs text-slate-400">RUC: {prov.ruc}</span>
                  </div>
                </div>
                
                {prov.contacto && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{prov.contacto}</span>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => abrirEditar(prov)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Editar</span>
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      if (window.confirm(`¿Está seguro de eliminar permanentemente a ${prov.razonSocial}?`)) {
                        eliminarMutation.mutate(prov.id);
                      }
                    }}
                    disabled={eliminarMutation.isPending}
                    className="rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-sm hover:shadow text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Eliminar</span>
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
                      <Loader2 className="h-8 w-8 animate-spin text-blue-650" />
                      <span className="text-sm font-medium">Cargando catálogo de proveedores...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="h-10 w-10 text-slate-300" />
                      <span className="text-sm font-medium">No se encontraron proveedores registrados</span>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors duration-200"
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

      {/* MODAL DE CREAR / EDITAR */}
      <Dialog open={modalOpen} onOpenChange={cerrarModal}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden p-6">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <span>{editando ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              {editando ? 'Modifica la información comercial del proveedor seleccionado.' : 'Completa todos los campos obligatorios para registrar un nuevo proveedor comercial.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="ruc" className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                <span>RUC</span>
                <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="ruc"
                placeholder="Ej: 20123456789 (11 dígitos)"
                value={formData.ruc}
                onChange={e => setFormData({...formData, ruc: e.target.value.replace(/\D/g, '').slice(0,11)})}
                className={`border-slate-200 focus-visible:ring-blue-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5 font-mono ${errores.ruc ? 'border-rose-300 bg-rose-50/20 focus-visible:ring-rose-500' : ''}`}
              />
              {errores.ruc && (
                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{errores.ruc}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="razon" className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                <span>Razón Social</span>
                <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="razon"
                placeholder="Ej: Distribuidora de Alimentos S.A.C."
                value={formData.razonSocial}
                onChange={e => setFormData({...formData, razonSocial: e.target.value})}
                className={`border-slate-200 focus-visible:ring-blue-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5 ${errores.razonSocial ? 'border-rose-300 bg-rose-50/20 focus-visible:ring-rose-500' : ''}`}
              />
              {errores.razonSocial && (
                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{errores.razonSocial}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contacto" className="text-slate-700 font-semibold text-sm">Contacto / Teléfono / Email</Label>
              <Input
                id="contacto"
                placeholder="Opcional (Ej: ventas@proveedor.com / 987654321)"
                value={formData.contacto}
                onChange={e => setFormData({...formData, contacto: e.target.value})}
                className="border-slate-200 focus-visible:ring-blue-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all py-5"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex gap-2">
            <Button type="button" variant="outline" onClick={cerrarModal} className="rounded-xl border-slate-200">
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleGuardar} 
              disabled={guardarMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow font-semibold"
            >
              {guardarMutation.isPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : editando ? (
                'Guardar Cambios'
              ) : (
                'Registrar Proveedor'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};