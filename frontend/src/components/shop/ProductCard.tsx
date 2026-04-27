import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface CardProps {
  producto: any;
  onVerDetalle: (p: any) => void;
  cantidadEnCarrito: number;
  onAgregar: (item: any) => void;
  esDeseo?: boolean; // <-- NUEVA PROPIEDAD
}

export const ProductoCard = ({ producto, onVerDetalle, cantidadEnCarrito, onAgregar, esDeseo = false }: CardProps) => {
  const [cantidadLocal, setCantidadLocal] = useState(1);
  const [estadoDeseo, setEstadoDeseo] = useState(esDeseo); // Estado visual local
  
  const accessToken = useAuthStore(state => state.accessToken);

  // Sincronizar estado local si el padre dice que cambió
  useEffect(() => {
    setEstadoDeseo(esDeseo);
  }, [esDeseo]);

  const stockDisponible = (producto.invStockProducto?.stockFisico || 0) - (producto.invStockProducto?.stockReservado || 0);
  const limiteMaximo = Math.max(0, stockDisponible - cantidadEnCarrito);
  const sinStock = limiteMaximo <= 0;
  const precioFinal = producto.precioOferta ? producto.precioOferta : producto.precioVenta;

  useEffect(() => {
    if (cantidadLocal > limiteMaximo) {
      setCantidadLocal(limiteMaximo === 0 ? 1 : limiteMaximo);
    }
  }, [limiteMaximo, cantidadLocal]);

  const handleAgregarDirecto = () => {
    if (sinStock || cantidadLocal > limiteMaximo) return;
    onAgregar({
      productoId: producto.id, nombre: producto.nombre, sku: producto.sku,
      precio: parseFloat(precioFinal), cantidad: cantidadLocal, stockDisponible
    });
    setCantidadLocal(1);
  };

  const handleToggleDeseo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken) {
      toast.error('Debe iniciar sesión para guardar en favoritos');
      return;
    }

    // Optimistic UI: Cambiamos el estado al instante para que el usuario note el feedback
    const nuevoEstado = !estadoDeseo;
    setEstadoDeseo(nuevoEstado);

    try {
      await api.post('/clientes/deseos', { productoId: producto.id });
      toast.success(nuevoEstado ? 'Agregado a deseos' : 'Eliminado de deseos');
    } catch (error) {
      // Si falla el Backend, revertimos el estado visual
      setEstadoDeseo(!nuevoEstado);
      toast.error('Error al actualizar favorito');
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 bg-white rounded-xl h-full">
      
      {/* Imagen */}
      <div 
        className="relative cursor-pointer bg-gray-50 h-52 flex items-center justify-center overflow-hidden"
        onClick={() => onVerDetalle(producto)}
      >
        <div className="text-center text-gray-300 group-hover:scale-110 transition-transform duration-300">
          <div className="text-5xl mb-2">🖼️</div>
          <p className="text-xs">Ver Detalle</p>
        </div>
        
        {/* Botón Corazón con diseño reactivo */}
        <button 
          onClick={handleToggleDeseo}
          className={`
            absolute top-2 left-2 p-1.5 rounded-full shadow-md z-10 transition-all duration-200 
            ${estadoDeseo 
              ? 'bg-red-100 text-red-500 hover:bg-red-200 border-2 border-red-300' 
              : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-400 border-2 border-transparent hover:border-gray-200 hover:bg-white'
            }
          `}
          title={estadoDeseo ? 'Quitar de deseos' : 'Agregar a deseos'}
        >
          {estadoDeseo ? '❤️' : '🤍'}
        </button>

        {producto.precioOferta && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">OFERTA</div>
        )}
        
        {cantidadEnCarrito > 0 && (
          <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10">
            {cantidadEnCarrito}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1 mb-4">
          <p className="text-[10px] font-mono text-gray-400 mb-1">{producto.sku}</p>
          <h3 
            className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight mb-2 cursor-pointer hover:text-blue-600"
            onClick={() => onVerDetalle(producto)}
          >
            {producto.nombre}
          </h3>
          
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-gray-900">S/ {parseFloat(precioFinal).toFixed(2)}</span>
            {producto.precioOferta && (
              <span className="text-xs line-through text-gray-400">S/ {parseFloat(producto.precioVenta).toFixed(2)}</span>
            )}
          </div>
        </div>

        <p className={`text-xs font-medium mb-3 ${sinStock ? 'text-red-500' : 'text-gray-500'}`}>
          {sinStock ? '⚠️ Agotado' : `Stock: ${limiteMaximo}`}
        </p>

        {/* Controles */}
        <div className="space-y-2 pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center justify-between border rounded-md bg-gray-50">
            <button className="px-3 py-2 text-gray-600 hover:text-black font-bold disabled:text-gray-300" onClick={() => setCantidadLocal(Math.max(1, cantidadLocal - 1))} disabled={sinStock || cantidadLocal <= 1}>−</button>
            <input type="number" value={cantidadLocal} onChange={(e) => setCantidadLocal(Math.max(1, Math.min(limiteMaximo, Number(e.target.value))))} className="w-10 text-center text-sm font-medium bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" disabled={sinStock} />
            <button className="px-3 py-2 text-gray-600 hover:text-black font-bold disabled:text-gray-300" onClick={() => setCantidadLocal(Math.min(limiteMaximo, cantidadLocal + 1))} disabled={sinStock || cantidadLocal >= limiteMaximo}>+</button>
          </div>

          <Button 
            className="w-full h-9 text-xs font-semibold transition-colors"
            onClick={handleAgregarDirecto}
            disabled={sinStock || cantidadLocal > limiteMaximo}
            variant={sinStock ? "secondary" : "default"}
          >
            {sinStock ? 'No disponible' : 'Agregar al carrito'}
          </Button>
        </div>
      </div>
    </div>
  );
};