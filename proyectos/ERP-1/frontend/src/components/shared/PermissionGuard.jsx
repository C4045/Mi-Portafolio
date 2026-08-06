import { useAuth } from '@/context/AuthContext';

export function PermissionGuard({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return children;
  }

  return fallback;
}
