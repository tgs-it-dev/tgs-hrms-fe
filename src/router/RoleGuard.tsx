import { Navigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import type { AppRole } from '@/constants/roles';

interface RoleGuardProps {
  requiredRole: AppRole | AppRole[];
  children: React.ReactNode;
  /** Route to redirect to when the user lacks the required role. Defaults to '/dashboard'. */
  redirectTo?: string;
}

/**
 * Wraps a route and redirects to `redirectTo` (default: /dashboard) when the
 * current user's role is not in `requiredRole`.
 *
 * Usage in AppRouter:
 *   <RoleGuard requiredRole={[ROLES.ADMIN, ROLES.HR_ADMIN]}>
 *     <EmployeesPage />
 *   </RoleGuard>
 */
export function RoleGuard({
  requiredRole,
  children,
  redirectTo = '/dashboard',
}: RoleGuardProps) {
  const { user } = useUser();
  const userRole = user?.role as AppRole | undefined;

  const allowed = Array.isArray(requiredRole)
    ? requiredRole.includes(userRole as AppRole)
    : userRole === requiredRole;

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
