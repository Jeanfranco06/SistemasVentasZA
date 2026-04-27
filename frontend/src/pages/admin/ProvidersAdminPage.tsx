// frontend/src/pages/admin/ProvidersAdminPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

// Tipado limpio (Sin estado activo/inactivo)
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
      // Si PostgreSQL bloquea por RESTRICT (P2003), cae aquí
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
      cell: info => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{String(info.getValue())}</span>
    },
    { accessorKey: 'razonSocial', header: 'Razón Social' },
    {
      accessorKey: 'contacto',
      header: 'Contacto',
      cell: info => info.getValue() ? <span>{String(info.getValue())}</span> : <span className="text-gray-400 italic">Sin contacto</span>
    },
    { 
      id: 'acciones', 
      header: 'Acciones', 
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => abrirEditar(row.original)}>
            ✏️ Editar
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
          >
            {eliminarMutation.isPending ? 'Eliminando...' : '🗑️ Eliminar'}
          </Button>
        </div>
      )
    }
  ];

  const table = useReactTable({ 
    data: proveedores || [], 
    columns, 
    getCoreRowModel: getCoreRowModel() 
  });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Eliminación física. No se podrá eliminar si tiene Órdenes de Compra asociadas.</p>
        </div>
        <Button onClick={abrirCrear}>+ Nuevo Proveedor</Button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-lg shadow border">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 border-b">
            <tr>
              {table.getHeaderGroups()[0].headers.map(h => (
                <th key={h.id} className="px-6 py-3 font-medium text-gray-600">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Cargando datos...</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">No hay proveedores registrados</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
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

      {/* MODAL DE CREAR / EDITAR */}
      <Dialog open={modalOpen} onOpenChange={cerrarModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Modifique los datos del proveedor.' : 'Complete los datos para registrar un nuevo proveedor.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC <span className="text-red-500">*</span></Label>
              <Input
                id="ruc"
                placeholder="Ej: 20123456789"
                value={formData.ruc}
                onChange={e => setFormData({...formData, ruc: e.target.value.replace(/\D/g, '').slice(0,11)})}
                className={errores.ruc ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errores.ruc && <p className="text-xs text-red-500">{errores.ruc}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="razon">Razón Social <span className="text-red-500">*</span></Label>
              <Input
                id="razon"
                placeholder="Ej: Corporación Distribuidora S.A.C."
                value={formData.razonSocial}
                onChange={e => setFormData({...formData, razonSocial: e.target.value})}
                className={errores.razonSocial ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errores.razonSocial && <p className="text-xs text-red-500">{errores.razonSocial}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto">Contacto / Email / Teléfono</Label>
              <Input
                id="contacto"
                placeholder="Opcional (Ej: ventas@corp.com / 999-888-777)"
                value={formData.contacto}
                onChange={e => setFormData({...formData, contacto: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button 
              type="button" 
              onClick={handleGuardar} 
              disabled={guardarMutation.isPending}
            >
              {guardarMutation.isPending ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};