import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart.store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: any | null;
}

export const ProductDetailModal = ({ open, onOpenChange, producto }: Props) => {
  // 1. TODOS LOS HOOKS DEBEN ESTAR ARRIBA, ANTES DE CUALQUIER RETURN
  const [cantidadLocal, setCantidadLocal] = useState(1);
  const itemsCarrito = useCartStore(state => state.items);
  const agregarItem = useCartStore(state => state.agregarItem);

  // Calcular valores de forma segura (no crashea si producto es null)
  const cantidadEnCarrito = producto ? (itemsCarrito.find(i => i.productoId === producto.id)?.cantidad || 0) : 0;

  const stockDisponible = producto 
    ? (producto.invStockProducto?.stockFisico || 0) - (producto.invStockProducto?.stockReservado || 0) 
    : 0;

  const limiteMaximo = Math.max(0, stockDisponible - cantidadEnCarrito);
  const sinStock = limiteMaximo <= 0;
  const precioFinal = producto ? (producto.precioOferta ? producto.precioOferta : producto.precioVenta) : 0;

  // Efectos seguros (se ejecutan siempre, pero la lógica interna evalúa si hay producto)
  useEffect(() => {
    if (open) {
      setCantidadLocal(1);
    }
  }, [open]);

  useEffect(() => {
    if (cantidadLocal > limiteMaximo) {
      setCantidadLocal(limiteMaximo === 0 ? 1 : limiteMaximo);
    }
  }, [limiteMaximo, cantidadLocal]);

  const handleAgregar = () => {
    if (sinStock || cantidadLocal > limiteMaximo || !producto) return;
    agregarItem({
      productoId: producto.id, 
      nombre: producto.nombre, 
      sku: producto.sku,
      precio: parseFloat(precioFinal), 
      cantidad: cantidadLocal, 
      stockDisponible
    });
    onOpenChange(false);
  };

  // 2. EL RETURN CONDICIONAL VA AL FINAL DE TODO
  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Imagen */}
          <div className="bg-gray-100 flex items-center justify-center min-h-[300px] p-8 border-r">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-sm">Imagen del Producto</p>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-2xl leading-tight">{producto.nombre}</DialogTitle>
              </DialogHeader>
              
              <p className="text-sm text-gray-500 mb-2">
                SKU: <span className="font-mono font-bold text-gray-700">{producto.sku}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Categoría: {producto.categoria?.nombre || 'Sin categoría'}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-extrabold text-blue-600">
                  S/ {parseFloat(precioFinal).toFixed(2)}
                </span>
                {producto.precioOferta && (
                  <span className="text-lg line-through text-gray-400">
                    S/ {parseFloat(producto.precioVenta).toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-6 leading-relaxed min-h-[60px]">
                {producto.descripcion || 'Este producto aún no tiene una descripción detallada registrada por el administrador.'}
              </p>

              {producto.catProductoAtributo?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {producto.catProductoAtributo.map((pa: any) => (
                    <Badge key={pa.valorAtributo.id} variant="secondary">
                      {pa.valorAtributo.atributo.nombre}: {pa.valorAtributo.valor}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Controles de Stock y Agregar */}
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold ${sinStock ? 'text-red-500' : 'text-green-600'}`}>
                  {sinStock ? 'Agotado' : `Stock disponible: ${limiteMaximo}`}
                </span>
                {cantidadEnCarrito > 0 && (
                  <span className="text-blue-600 font-medium">
                    Ya tienes {cantidadEnCarrito} en tu carrito
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md bg-white">
                  <button 
                    className="px-3 py-2 text-gray-600 hover:text-black disabled:opacity-50" 
                    onClick={() => setCantidadLocal(Math.max(1, cantidadLocal - 1))} 
                    disabled={sinStock}
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    value={cantidadLocal} 
                    onChange={(e) => setCantidadLocal(Math.max(1, Math.min(limiteMaximo, Number(e.target.value))))} 
                    className="w-12 text-center border-x py-2 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    disabled={sinStock}
                  />
                  <button 
                    className="px-3 py-2 text-gray-600 hover:text-black disabled:opacity-50" 
                    onClick={() => setCantidadLocal(Math.min(limiteMaximo, cantidadLocal + 1))} 
                    disabled={sinStock || cantidadLocal >= limiteMaximo}
                  >
                    +
                  </button>
                </div>
                <Button 
                  className="flex-1 h-12 text-base font-bold" 
                  onClick={handleAgregar} 
                  disabled={sinStock || cantidadLocal > limiteMaximo}
                >
                  {sinStock ? 'Producto Agotado' : 'Agregar al Carrito'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};