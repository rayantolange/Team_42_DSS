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

export interface SystemStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  deactivatedUsers: number;
  roleCounts: Record<string, number>;
}

interface SystemStatsApiResponse {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  active_users: number;
  deactivated_users: number;
  role_counts: Record<string, number>;
}

export async function fetchSystemStats(): Promise<SystemStats> {
  const response = await apiClient.get<SystemStatsApiResponse>("/admin/stats");
  const s = response.data;

  return {
    totalUsers: s.total_users,
    verifiedUsers: s.verified_users,
    unverifiedUsers: s.unverified_users,
    activeUsers: s.active_users,
    deactivatedUsers: s.deactivated_users,
    roleCounts: s.role_counts,
  };
}