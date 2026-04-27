// frontend/src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  usuario: Usuario | null;
  setAuth: (token: string, user: Usuario) => void;
  logout: () => void;
  tienePermiso: (modulo: string, accion: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      usuario: null,
      setAuth: (token, user) => set({ accessToken: token, usuario: user }),
      logout: () => set({ accessToken: null, usuario: null }),
      tienePermiso: (modulo, accion) => {
        const { usuario } = get();
        if (!usuario) return false;
        if (usuario.roles.includes('Administrador')) return true;
        // Lógica de permisos granulares
        return false;
      }
    }),
    { name: 'stockflow-auth' }
  )
);