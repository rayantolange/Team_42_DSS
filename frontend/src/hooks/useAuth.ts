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
  const isPrincipal = user?.role === "principal";
  const isHod = user?.role === "hod";
  const isFaculty = user?.role === "faculty";
  const isStaff = user?.role === "staff";

  /** Principal sees/acts across every department; everyone else is scoped to their own. */
  const canSeeAllDepartments = isPrincipal;

  /** The department a department-scoped user is limited to, if any. */
  const scopedDepartmentId = canSeeAllDepartments ? null : user?.departmentId ?? null;

  /** Principal (full) and HOD (within their own department) can create/edit decisions. */
  const canActOnDecisions = isPrincipal || isHod;

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isPrincipal,
    isHod,
    isFaculty,
    isStaff,
    canSeeAllDepartments,
    scopedDepartmentId,
    canActOnDecisions,
    login,
    logout,
  };
}