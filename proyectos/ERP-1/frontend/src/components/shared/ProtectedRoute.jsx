import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ permission, children, fallback }) {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return <Navigate to="/dashboard" replace />;
}
