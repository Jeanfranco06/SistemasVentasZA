import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface Props {
  children: React.ReactNode;
  roles: string[];
}

export const ProtectedRoute = ({ children, roles }: Props) => {
  const { usuario, accessToken } = useAuthStore();
  
  // 1. Si no hay token, expulsar al login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Si no hay objeto de usuario (raro, pero por seguridad)
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 3. Verificación de Roles
  // Si el array de roles está vacío [], significa que cualquiera que esté logueado puede pasar (ej: Clientes)
  // Si el array tiene roles, verificar si el usuario tiene al menos uno de ellos o es Admin
  const esAdmin = usuario.roles.includes('Administrador');
  const tienePermiso = roles.length === 0 || esAdmin || usuario.roles.some(r => roles.includes(r));

  if (!tienePermiso) {
    // Si no tiene permiso, lo mandamos a la página principal (o podrías mandarlo a un 403)
    return <Navigate to="/" replace />;
  }
  
  // 4. Si todo está bien, renderizar el componente hijo (la página)
  return <>{children}</>;
};