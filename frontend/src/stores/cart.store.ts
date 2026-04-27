// frontend/src/stores/cart.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

export interface ProductoCarrito {
  productoId: number;
  nombre: string;
  sku: string;
  precio: number;
  cantidad: number;
  stockDisponible: number;
  imagenUrl?: string;
}

interface CartState {
  items: ProductoCarrito[];
  agregarItem: (item: ProductoCarrito) => void;
  modificarCantidad: (productoId: number, nuevaCantidad: number) => void;
  eliminarItem: (productoId: number) => void;
  limpiarCarrito: () => void;
  getCantidad: (productoId: number) => number;
  calcularTotales: () => { subtotal: number; igv: number; total: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      agregarItem: (nuevoItem) => {
        set((state) => {
          const existente = state.items.find(i => i.productoId === nuevoItem.productoId);
          let nuevosItems;
          
          if (existente) {
            nuevosItems = state.items.map(i => 
              i.productoId === nuevoItem.productoId 
                ? { ...i, cantidad: i.cantidad + nuevoItem.cantidad } 
                : i
            );
          } else {
            nuevosItems = [...state.items, nuevoItem];
          }
          return { items: nuevosItems };
        });
        
        // ID único 'cart-global' evita que se muestre duplicado en renders rápidos
        toast.success(`${nuevoItem.nombre} añadido al carrito`, { 
          id: 'cart-global-toast',
          duration: 2000,
          position: 'bottom-right',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      },

      modificarCantidad: (productoId, nuevaCantidad) => {
        if (nuevaCantidad < 1) {
          get().eliminarItem(productoId);
          return;
        }
        set({
          items: get().items.map(i => 
            i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i
          )
        });
      },

      eliminarItem: (productoId) => {
        set({ items: get().items.filter(i => i.productoId !== productoId) });
      },

      limpiarCarrito: () => set({ items: [] }),

      // Función optimizada para que las Cards consulten la cantidad sin suscribirse a todo el array
      getCantidad: (productoId) => {
        const item = get().items.find(i => i.productoId === productoId);
        return item ? item.cantidad : 0;
      },

      calcularTotales: () => {
        const subtotal = get().items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
        return { subtotal, igv: subtotal * 0.18, total: subtotal * 1.18 };
      }
    }),
    { name: 'stockflow-cart' }
  )
);