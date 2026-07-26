import { apiClient } from "./apiClient";
import type { Department } from "@/types/domain";

// Shape returned by GET /departments/ (matches backend's DepartmentResponse)
interface DepartmentApiResponse {
  department_id: number;
  department_name: string;
  department_type: string | null;
  description: string | null;
  is_active: boolean;
}

function toDepartmentType(raw: string | null): "Academic" | "Administrative" {
  if (raw?.includes("Academic")) return "Academic";
  return "Administrative";
}

export async function fetchDepartments(): Promise<Department[]> {
  const response =
    await apiClient.get<DepartmentApiResponse[]>("/departments/");
  return response.data.map((dept) => ({
    id: String(dept.department_id),
    name: dept.department_name,
    type: toDepartmentType(dept.department_type),
    description: dept.description ?? "",
    policyCount: 0,
    keyRegulations: [],
    isActive: dept.is_active,
  }));
}

export interface CreateDepartmentRequest {
  name: string;
  type?: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  type?: string;
  description?: string;
}

export async function createDepartment(
  data: CreateDepartmentRequest,
): Promise<Department> {
  const response = await apiClient.post<DepartmentApiResponse>(
    "/departments/",
    {
      department_name: data.name,
      department_type: data.type ?? null,
      description: data.description ?? null,
    },
  );
  const d = response.data;
  return {
    id: String(d.department_id),
    name: d.department_name,
    type: toDepartmentType(d.department_type),
    description: d.description ?? "",
    policyCount: 0,
    keyRegulations: [],
    isActive: d.is_active,
  };
}

export async function updateDepartment(
  departmentId: string,
  data: UpdateDepartmentRequest,
): Promise<Department> {
  const response = await apiClient.patch<DepartmentApiResponse>(
    `/departments/${departmentId}`,
    {
      ...(data.name !== undefined && { department_name: data.name }),
      ...(data.type !== undefined && { department_type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
    },
  );
  const d = response.data;
  return {
    id: String(d.department_id),
    name: d.department_name,
    type: toDepartmentType(d.department_type),
    description: d.description ?? "",
    policyCount: 0,
    keyRegulations: [],
    isActive: d.is_active,
  };
}

export async function fetchAllDepartments(): Promise<Department[]> {
  const response =
    await apiClient.get<DepartmentApiResponse[]>("/departments/all");
  return response.data.map((dept) => ({
    id: String(dept.department_id),
    name: dept.department_name,
    type: toDepartmentType(dept.department_type),
    description: dept.description ?? "",
    policyCount: 0,
    keyRegulations: [],
    isActive: dept.is_active,
  }));
}

export async function toggleDepartmentActive(
  departmentId: string,
): Promise<Department> {
  const response = await apiClient.patch<DepartmentApiResponse>(
    `/departments/${departmentId}/toggle-active`,
  );
  const d = response.data;
  return {
    id: String(d.department_id),
    name: d.department_name,
    type: toDepartmentType(d.department_type),
    description: d.description ?? "",
    policyCount: 0,
    keyRegulations: [],
    isActive: d.is_active,
  };
}
