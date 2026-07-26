import { apiClient } from "./apiClient";
import type { LoginRequest, LoginResponse } from "@/types/api";

// Shape returned by POST /auth/login (matches backend's Token schema)
interface LoginTokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  full_name: string;
  role: string;
}

export async function login({ email, password, rememberMe }: LoginRequest): Promise<LoginResponse> {
  // Step A: build the form-encoded body (not JSON!)
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  formData.append("remember_me", String(rememberMe ?? false));

  // Step B: send it to the backend
  const tokenResponse = await apiClient.post<LoginTokenResponse>(
    "/auth/login",
    formData,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  // Step C: shape of what GET /auth/me returns (matches backend's UserResponse)
  interface MeResponse {
    user_id: number;
    department_id: number;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }

  // Step D: use the token we just got to ask "who am I?"
  const meResponse = await apiClient.get<MeResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
  });

  // Step E: combine both responses into the shape the frontend expects
  return {
    accessToken: tokenResponse.data.access_token,
    user: {
      id: String(meResponse.data.user_id),
      name: meResponse.data.full_name,
      email: meResponse.data.email,
      role: meResponse.data.role as "admin" | "principal" | "hod" | "faculty" | "staff",
      departmentId: String(meResponse.data.department_id),
    },
  };
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  departmentId: string;
  role: string;
}

// Shape returned by POST /auth/register (matches backend's UserResponse)
interface RegisterApiResponse {
  user_id: number;
  department_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export async function register({
  fullName,
  email,
  password,
  departmentId,
  role,
}: RegisterRequest) {
  const response = await apiClient.post<RegisterApiResponse>("/auth/register", {
    full_name: fullName,
    email,
    password,
    department_id: Number(departmentId),
    role,
  });

  return {
    id: String(response.data.user_id),
    fullName: response.data.full_name,
    email: response.data.email,
    departmentId: String(response.data.department_id),
    status: "pending_verification" as const,
  };
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/auth/forgot-password", {
    email,
  });
  return response.data;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
  return response.data;
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const response = await apiClient.get<{ message: string }>("/auth/verify-email", {
    params: { token },
  });
  return response.data;
}