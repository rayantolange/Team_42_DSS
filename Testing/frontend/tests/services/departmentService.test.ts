import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  fetchDepartments,
  fetchAllDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentActive,
  fetchDepartmentById,
} from "./departmentService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("departmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDepartments", () => {
    it("maps wire fields to Department shape with defaults", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            department_id: 1,
            department_name: "IT",
            department_type: "Administrative",
            description: "IT department",
            is_active: true,
          },
        ],
      });

      const result = await fetchDepartments();

      expect(apiClient.get).toHaveBeenCalledWith("/departments");
      expect(result).toEqual([
        {
          id: "1",
          name: "IT",
          type: "Administrative",
          description: "IT department",
          policyCount: 0,
          keyRegulations: [],
          isActive: true,
        },
      ]);
    });

    it("defaults missing department_type to 'Academic' and missing description to ''", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            department_id: 2,
            department_name: "HR",
            department_type: null,
            description: null,
            is_active: false,
          },
        ],
      });

      const result = await fetchDepartments();

      expect(result[0].type).toBe("Academic");
      expect(result[0].description).toBe("");
    });
  });

  describe("fetchAllDepartments", () => {
    it("calls /departments/all", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      await fetchAllDepartments();

      expect(apiClient.get).toHaveBeenCalledWith("/departments/all");
    });
  });

  describe("createDepartment", () => {
    it("sends camelCase input as snake_case and maps the response", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          department_id: 3,
          department_name: "Finance",
          department_type: "Administrative",
          description: "Finance dept",
          is_active: true,
        },
      });

      const result = await createDepartment({
        departmentName: "Finance",
        departmentType: "Administrative",
        description: "Finance dept",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/departments", {
        department_name: "Finance",
        department_type: "Administrative",
        description: "Finance dept",
      });
      expect(result.id).toBe("3");
      expect(result.name).toBe("Finance");
    });
  });

  describe("updateDepartment", () => {
    it("sends patch to the correct id endpoint with snake_case body", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: {
          department_id: 4,
          department_name: "Updated Name",
          department_type: "Academic",
          description: "Updated desc",
          is_active: true,
        },
      });

      const result = await updateDepartment("4", {
        departmentName: "Updated Name",
        description: "Updated desc",
      });

      expect(apiClient.patch).toHaveBeenCalledWith("/departments/4", {
        department_name: "Updated Name",
        department_type: undefined,
        description: "Updated desc",
      });
      expect(result.name).toBe("Updated Name");
    });
  });

  describe("toggleDepartmentActive", () => {
    it("calls patch on the toggle-active endpoint", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: {
          department_id: 5,
          department_name: "IT",
          department_type: "Administrative",
          description: "",
          is_active: false,
        },
      });

      const result = await toggleDepartmentActive("5");

      expect(apiClient.patch).toHaveBeenCalledWith("/departments/5/toggle-active");
      expect(result.isActive).toBe(false);
    });
  });

  describe("fetchDepartmentById", () => {
    it("returns the matching department from the full list", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            department_id: 1,
            department_name: "IT",
            department_type: "Administrative",
            description: "",
            is_active: true,
          },
          {
            department_id: 2,
            department_name: "HR",
            department_type: "Administrative",
            description: "",
            is_active: true,
          },
        ],
      });

      const result = await fetchDepartmentById("2");

      expect(result.name).toBe("HR");
    });

    it("throws an error when the department is not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      await expect(fetchDepartmentById("99")).rejects.toThrow(
        "Department not found: 99"
      );
    });
  });
});