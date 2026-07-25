import { useAuthStore } from "@store/authStore";

/**
 * Convenience hook for auth state + role checks in components.
 * Wraps useAuthStore so components don't need to know store internals.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const isAdmin = user?.role === "admin";
  const isDepartmentHead = user?.role === "department_head";

  /** The department a non-admin user is scoped to, if any. */
  const scopedDepartmentId = isAdmin ? null : user?.departmentId ?? null;

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isDepartmentHead,
    scopedDepartmentId,
    login,
    logout,
  };
}
