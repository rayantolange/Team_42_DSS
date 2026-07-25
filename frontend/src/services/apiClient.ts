import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@store/authStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/**
 * Central Axios instance for all backend calls.
 *
 * - Injects the Authorization header from the auth store on every request.
 * - On a 401 response, clears auth state and redirects to /login so the
 *   user is automatically logged out (token expired/invalid).
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // Avoid a hard redirect loop if we're already on /login
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Flag indicating whether real backend endpoints should be used.
 * While teammates' FastAPI endpoints are unavailable, mock services
 * (see services/mock/*) are used instead. Flip this once endpoints
 * are live, or wire it to an env var.
 */
export const USE_MOCK_API =
  (import.meta.env.VITE_USE_MOCK_API ?? "true") === "true";
