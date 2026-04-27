// frontend/src/pages/admin/ProductFormPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const esEdicion = Boolean(id);
  const queryClient = useQueryClient();

  // Detectar si estamos en contexto de inventario o admin
  const isInventoryContext = window.location.pathname.includes('/inventario');
  const basePath = isInventoryContext ? '/inventario/productos' : '/admin/productos';

  const [formData, setFormData] = useState({
    nombre: '',
    sku: '',
    categoriaId: '',
    imagenUrl: '',
    precioCosto: '',
    precioVenta: '',
    stockActual: '',
    stockMinimo: '',
    estado: 'borrador'
  });

  // 1. Cargar categorías para el Select
  const { data: categorias } = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: async () => { const { data } = await api.get('/categorias/admin'); return data.data; }
  });

  // 2. Si es edición, cargar datos del producto
  const { data: productoEditar, isLoading: cargandoProducto } = useQuery({
    queryKey: ['producto-editar', id],
    queryFn: async () => {
      const { data } = await api.get(`/productos/admin/${id}`);
      return data.data;
    },
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && productoEditar) {
      setFormData({
        nombre: productoEditar.nombre,
        sku: productoEditar.sku,
        categoriaId: String(productoEditar.categoriaId),
        imagenUrl: productoEditar.catImagenesProducto?.[0]?.urlImagen ?? '',
        precioCosto: String(productoEditar.precioCosto),
        precioVenta: String(productoEditar.precioVenta),
        stockActual: String(productoEditar.invStockProducto?.stockFisico || ''),
        stockMinimo: String(productoEditar.invStockProducto?.stockMinimo || ''),
        estado: productoEditar.estado
      });
    }
  }, [esEdicion, productoEditar]);

  // 3. Autogenerar SKU si crea uno nuevo y elige categoría
  useEffect(() => {
    if (!esEdicion && formData.categoriaId) {
      api.get(`/productos/next-sku?categoriaId=${formData.categoriaId}`).then(res => {
        setFormData(prev => ({ ...prev, sku: res.data.data.sku }));
      });
    }
  }, [formData.categoriaId, esEdicion]);

  // 4. Mutación de Guardado (Crea o Actualiza)
  const guardarMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        categoriaId: Number(data.categoriaId),
        precioCosto: Number(data.precioCosto),
        precioVenta: Number(data.precioVenta),
        stockActual: data.stockActual ? Number(data.stockActual) : undefined,
        stockMinimo: data.stockMinimo ? Number(data.stockMinimo) : undefined,
      };
      if (esEdicion) return api.put(`/productos/${id}`, payload);
      return api.post('/productos', payload);
    },
    onSuccess: () => {
      toast.success(esEdicion ? 'Producto actualizado' : 'Producto creado');
      queryClient.invalidateQueries({ queryKey: ['admin-productos'] });
      navigate(basePath);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      if (msg?.includes('prefijo del SKU no corresponde')) {
        toast.error(msg, { duration: 5000 });
      } else {
        toast.error('Error al guardar el producto');
      }
    }
  });

  if (esEdicion && cargandoProducto) return <div className="p-10 text-center">Cargando datos del producto...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(basePath)} className="mb-4">← Volver al listado</Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{esEdicion ? `Editando Producto (ID: ${id})` : 'Crear Nuevo Producto'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoría (Define el prefijo SKU)</Label>
              <Select value={formData.categoriaId} onValueChange={val => setFormData({...formData, categoriaId: val})}>
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  {categorias?.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre} ({cat.prefijoSku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>SKU</Label>
              <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} placeholder="ELE-001" disabled={!formData.categoriaId && !esEdicion} />
              <p className="text-xs text-red-500 mt-1">Si edita este campo manualmente, el prefijo debe coincidir con la categoría.</p>
            </div>
          </div>

          <div>
            <Label>Nombre del Producto</Label>
            <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>

          <div>
            <Label>Imagen principal (URL)</Label>
            <Input
              value={formData.imagenUrl}
              onChange={e => setFormData({...formData, imagenUrl: e.target.value})}
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Si dejas este campo vacío, el producto se guardará sin imagen principal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Precio de Costo (S/)</Label>
              <Input type="number" step="0.01" value={formData.precioCosto} onChange={e => setFormData({...formData, precioCosto: e.target.value})} />
            </div>
            <div>
              <Label>Precio de Venta (S/)</Label>
              <Input type="number" step="0.01" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stock Actual</Label>
              <Input type="number" min="0" value={formData.stockActual} onChange={e => setFormData({...formData, stockActual: e.target.value})} />
            </div>
            <div>
              <Label>Stock Mínimo</Label>
              <Input type="number" min="0" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} />
            </div>
          </div>

          {esEdicion && (
            <div>
              <Label>Estado del Producto</Label>
              <Select value={formData.estado} onValueChange={val => setFormData({...formData, estado: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="activo">Activo (Visible en tienda)</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate(basePath)}>Cancelar</Button>
            <Button onClick={() => guardarMutation.mutate(formData)} disabled={guardarMutation.isPending || !formData.nombre || !formData.sku}>
              {guardarMutation.isPending ? 'Guardando...' : esEdicion ? 'Actualizar Producto' : 'Crear Producto'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
