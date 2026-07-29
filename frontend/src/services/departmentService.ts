import { apiClient } from "./apiClient";
import type { Department, DepartmentType } from "@/types/domain";

interface DepartmentWire {
  department_id: number;
  department_name: string;
  department_type?: string | null;
  description?: string | null;
  is_active: boolean;
}

function toDepartment(w: DepartmentWire): Department {
  return {
    id: String(w.department_id),
    name: w.department_name,
    type: (w.department_type as DepartmentType) ?? "Academic",
    description: w.description ?? "",
    policyCount: 0,
    keyRegulations: [],
    isActive: w.is_active,
  };
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<DepartmentWire[]>("/departments");
  return data.map(toDepartment);
}

export async function fetchAllDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<DepartmentWire[]>("/departments/all");
  return data.map(toDepartment);
}

export interface CreateDepartmentRequest {
  departmentName: string;
  departmentType?: string;
  description?: string;
}

export async function createDepartment(
  input: CreateDepartmentRequest,
): Promise<Department> {
  const { data } = await apiClient.post<DepartmentWire>("/departments", {
    department_name: input.departmentName,
    department_type: input.departmentType,
    description: input.description,
  });
  return toDepartment(data);
}

export interface UpdateDepartmentRequest {
  departmentName?: string;
  departmentType?: string;
  description?: string;
}

export async function updateDepartment(
  departmentId: string,
  input: UpdateDepartmentRequest,
): Promise<Department> {
  const { data } = await apiClient.patch<DepartmentWire>(
    `/departments/${departmentId}`,
    {
      department_name: input.departmentName,
      department_type: input.departmentType,
      description: input.description,
    },
  );
  return toDepartment(data);
}

export async function toggleDepartmentActive(
  departmentId: string,
): Promise<Department> {
  const { data } = await apiClient.patch<DepartmentWire>(
    `/departments/${departmentId}/toggle-active`,
  );
  return toDepartment(data);
}

export async function fetchDepartmentById(id: string): Promise<Department> {
  const departments = await fetchDepartments();
  const department = departments.find((d) => d.id === id);
  if (!department) {
    throw new Error(`Department not found: ${id}`);
  }
  return department;
}
