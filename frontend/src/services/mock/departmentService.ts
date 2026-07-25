import { DEPARTMENTS, getDepartmentById } from "@/data/datasetLoader";
import type { Department } from "@/types/domain";
import { mockDelay, maybeThrowMockError } from "./mockUtils";

/**
 * Mock implementation of the departments endpoint. Swap for a real
 * Axios call (apiClient.get<Department[]>("/departments")) once the
 * FastAPI endpoint is available — the calling hooks don't need to
 * change, only this file.
 */
export async function fetchDepartments(): Promise<Department[]> {
  await mockDelay(250);
  maybeThrowMockError("fetchDepartments");
  return DEPARTMENTS;
}

export async function fetchDepartmentById(id: string): Promise<Department> {
  await mockDelay(200);
  const department = getDepartmentById(id);
  if (!department) {
    throw new Error(`Department not found: ${id}`);
  }
  return department;
}
