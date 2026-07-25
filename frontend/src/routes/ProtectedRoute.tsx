import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import type { UserRole } from "@/types/domain";

interface ProtectedRouteProps {
  /** If provided, only these roles may access the nested routes. */
  allowedRoles?: UserRole[];
}

/**
 * Wraps nested routes (via <Outlet />) and:
 * - Redirects unauthenticated users to /login, preserving the
 *   originally requested location so we can return after login.
 * - Optionally restricts access by role, redirecting unauthorized
 *   roles to a "not authorized" page instead of the data they
 *   shouldn't see.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
}
