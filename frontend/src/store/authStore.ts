import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/types/domain";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  /** True for admins, who can see all departments. */
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "dss-auth", // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
