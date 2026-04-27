// frontend/src/pages/admin/ProductFormPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { X, Upload, Image, Star } from 'lucide-react';

export const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const esEdicion = Boolean(id);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Estado para imágenes
  const [imagenes, setImagenes] = useState<Array<{ id: number; urlImagen: string; orden: number }>>([]);
  const [archivosParaSubir, setArchivosParaSubir] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);

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

  // Cargar imágenes del producto (si es edición)
  const { data: imagenesData } = useQuery({
    queryKey: ['producto-imagenes', id],
    queryFn: async () => {
      const { data } = await api.get(`/productos/${id}/imagenes`);
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

  useEffect(() => {
    if (imagenesData) {
      setImagenes(imagenesData);
    }
  }, [imagenesData]);

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
    onSuccess: async (response) => {
      const productId = esEdicion ? Number(id) : response.data.data.id;
      toast.success(esEdicion ? 'Producto actualizado' : 'Producto creado');
      queryClient.invalidateQueries({ queryKey: ['admin-productos'] });
      
      // Si hay archivos para subir, subirlos después de guardar
      if (archivosParaSubir.length > 0 && productId) {
        try {
          const formDataImagen = new FormData();
          archivosParaSubir.forEach(archivo => {
            formDataImagen.append('imagenes', archivo);
          });
          await api.post(`/productos/${productId}/imagenes`, formDataImagen, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success('Imágenes subidas correctamente');
        } catch (err) {
          toast.error('Producto creado pero hubo error al subir imágenes');
        }
      }
      
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

  // Mutación para subir imágenes
  const subirArchivosMutation = useMutation({
    mutationFn: async (archivos: File[]) => {
      const formDataImagen = new FormData();
      archivos.forEach(archivo => {
        formDataImagen.append('imagenes', archivo);
      });
      const { data } = await api.post(`/productos/${id}/imagenes`, formDataImagen, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producto-imagenes'] });
      setArchivosParaSubir([]);
      setPrevisualizaciones([]);
      toast.success('Imágenes subidas correctamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al subir imágenes');
    }
  });

  // Mutación para eliminar imagen
  const eliminarImagenMutation = useMutation({
    mutationFn: async (imagenId: number) => {
      await api.delete(`/productos/${id}/imagenes/${imagenId}`);
      return imagenId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producto-imagenes'] });
      toast.success('Imagen eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar imagen');
    }
  });

  // Mutación para establecer imagen principal
  const establecerPrincipalMutation = useMutation({
    mutationFn: async (imagenId: number) => {
      await api.put(`/productos/${id}/imagenes/${imagenId}/principal`);
      return imagenId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producto-imagenes'] });
      toast.success('Imagen principal establecida');
    },
    onError: () => {
      toast.error('Error al establecer imagen principal');
    }
  });

  // Manejar selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const nuevosArchivos = Array.from(e.target.files);
      
      // Validar que no se exceda el límite de 10 imágenes totales
      const totalImagenes = imagenes.length + archivosParaSubir.length + nuevosArchivos.length;
      if (totalImagenes > 10) {
        toast.error('Máximo 10 imágenes por producto');
        return;
      }

      setArchivosParaSubir(prev => [...prev, ...nuevosArchivos]);

      // Crear previsualizaciones
      const nuevasPrevisualizaciones = nuevosArchivos.map(archivo => URL.createObjectURL(archivo));
      setPrevisualizaciones(prev => [...prev, ...nuevasPrevisualizaciones]);
    }
  };

  // Eliminar archivo de la lista de espera
  const eliminarArchivoEspera = (index: number) => {
    setArchivosParaSubir(prev => prev.filter((_, i) => i !== index));
    setPrevisualizaciones(prev => prev.filter((_, i) => i !== index));
  };

  if (esEdicion && cargandoProducto) return <div className="p-10 text-center">Cargando datos del producto...</div>;

  return (
    <div className="max-w-4xl mx-auto">
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

          {/* Sección de Imágenes */}
          <div className="space-y-4">
            <Label>Imágenes del Producto</Label>
            
            {/* Imágenes existentes (solo edición) */}
            {esEdicion && imagenes.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {imagenes.map((imagen) => {
                  // Construir URL de la imagen
                  let urlImagen = imagen.urlImagen;
                  if (!urlImagen.startsWith('http') && !urlImagen.startsWith('/api')) {
                    const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin + '/api/v1';
                    const baseUrl = apiBaseUrl.replace('/api/v1', '');
                    urlImagen = baseUrl + urlImagen;
                  }
                  
                  return (
                    <div key={imagen.id} className="relative group aspect-square">
                      <img 
                        src={urlImagen}
                        alt="Producto"
                        className="w-full h-full object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Error cargando imagen:', urlImagen);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {imagen.orden === 0 && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-white p-1 rounded">
                          <Star className="w-3 h-3" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {imagen.orden !== 0 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => establecerPrincipalMutation.mutate(imagen.id)}
                            title="Establecer como principal"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => eliminarImagenMutation.mutate(imagen.id)}
                          title="Eliminar imagen"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Previsualización de archivos en espera */}
            {previsualizaciones.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-blue-600">Imágenes pendientes de subir ({previsualizaciones.length})</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {previsualizaciones.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img 
                        src={preview}
                        alt={`Previsualización ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-blue-300"
                      />
                      <div className="absolute top-1 right-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => eliminarArchivoEspera(index)}
                          title="Eliminar de la lista"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Pendiente
                      </div>
                    </div>
                  ))}
                </div>
                {archivosParaSubir.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => subirArchivosMutation.mutate(archivosParaSubir)}
                    disabled={subirArchivosMutation.isPending}
                  >
                    {subirArchivosMutation.isPending ? 'Subiendo...' : `Subir ${archivosParaSubir.length} imagen(es)`}
                  </Button>
                )}
              </div>
            )}

            {/* Botón para agregar imágenes */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={(imagenes.length + archivosParaSubir.length) >= 10}
              >
                <Upload className="w-4 h-4 mr-2" />
                {(imagenes.length + archivosParaSubir.length) >= 10 
                  ? 'Máximo 10 imágenes' 
                  : 'Agregar imágenes'}
              </Button>
              <span className="text-xs text-gray-500">
                {(imagenes.length + archivosParaSubir.length)}/10 imágenes
              </span>
            </div>
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