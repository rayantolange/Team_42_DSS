import { apiClient } from "./apiClient";
import type { Department } from "@/types/domain";

// Shape returned by GET /departments/ (matches backend's DepartmentResponse)
interface DepartmentApiResponse {
  department_id: number;
  department_name: string;
  department_type: string | null;
  description: string | null;
}

export async function fetchDepartments(): Promise<Department[]> {
  const response =
    await apiClient.get<DepartmentApiResponse[]>("/departments/");

  return response.data.map((dept) => ({
    id: String(dept.department_id),
    name: dept.department_name,
    type: dept.department_type ?? "",
    description: dept.description ?? "",
    policyCount: 0,
    keyRegulations: [],
  }));
}
