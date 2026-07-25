import { apiClient } from "./apiClient";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "principal" | "hod" | "faculty" | "staff";
  departmentId: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// Shape returned by GET /admin/users (matches backend's AdminUserResponse)
interface AdminUserApiResponse {
  user_id: number;
  department_id: number;
  full_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUserApiResponse[]>("/admin/users");

  return response.data.map((u) => ({
    id: String(u.user_id),
    fullName: u.full_name,
    email: u.email,
    role: u.role as AdminUser["role"],
    departmentId: String(u.department_id),
    isVerified: u.is_verified,
    isActive: u.is_active,
    createdAt: u.created_at,
  }));
}

export async function updateUserRole(
  userId: string,
  role: AdminUser["role"]
): Promise<AdminUser> {
  const response = await apiClient.patch<AdminUserApiResponse>(
    `/admin/users/${userId}/role`,
    { role }
  );

  const u = response.data;
  return {
    id: String(u.user_id),
    fullName: u.full_name,
    email: u.email,
    role: u.role as AdminUser["role"],
    departmentId: String(u.department_id),
    isVerified: u.is_verified,
    isActive: u.is_active,
    createdAt: u.created_at,
  };
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/admin/users/${userId}`);
  return response.data;
}