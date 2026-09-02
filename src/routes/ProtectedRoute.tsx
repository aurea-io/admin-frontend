import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { PlatformRole } from '../types/auth';
import { ForbiddenPage } from '../pages/ForbiddenPage';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: PlatformRole | PlatformRole[];
  requiredCapability?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <ForbiddenPage />;
    }
  }

  // TODO: Check capability requirement when capabilities are loaded
  // This will be implemented when capabilities API is available

  return <>{children}</>;
}
