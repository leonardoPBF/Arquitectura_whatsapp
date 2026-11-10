import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireCustomer = false 
}) => {
  const { isAuthenticated, isAdmin, isCustomer, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando tu sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/tienda" replace />;
  }

  if (requireCustomer && !isCustomer) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

