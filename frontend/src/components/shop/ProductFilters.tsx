import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FiltersProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  categoriaId: string;
  setCategoriaId: (val: string) => void;
  ordenamiento: string;
  setOrdenamiento: (val: string) => void;
  categorias: any[];
  onLimpiar: () => void;
}

export const ProductFilters = ({ busqueda, setBusqueda, categoriaId, setCategoriaId, ordenamiento, setOrdenamiento, categorias, onLimpiar }: FiltersProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <Label className="mb-1 block text-xs font-medium text-gray-500">Buscar por Nombre o SKU</Label>
          <Input 
            placeholder="Ej. Laptop, ELE-001..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="h-10"
          />
        </div>

        {/* Categoría */}
        <div>
          <Label className="mb-1 block text-xs font-medium text-gray-500">Categoría</Label>
          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((cat: any) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ordenamiento */}
        <div>
          <Label className="mb-1 block text-xs font-medium text-gray-500">Ordenar por</Label>
          <Select value={ordenamiento} onValueChange={setOrdenamiento}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Relevancia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relevancia">Relevancia</SelectItem>
              <SelectItem value="precio-asc">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="precio-desc">Precio: Mayor a Menor</SelectItem>
              <SelectItem value="nombre-asc">Nombre: A - Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {(busqueda || categoriaId !== 'todas' || ordenamiento !== 'relevancia') && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <span>Filtros activos:</span>
          <Button variant="ghost" size="sm" onClick={onLimpiar} className="h-7 text-xs underline text-red-500 hover:text-red-700">
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
};