import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  fetchAllConstraints,
  createConstraint,
  fetchConstraintsForDecision,
  linkConstraintToDecision,
  unlinkConstraintFromDecision,
} from "./constraintService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("constraintService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAllConstraints", () => {
    it("maps snake_case fields to camelCase", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            constraint_id: 1,
            constraint_type: "financial",
            description: "Budget limit",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchAllConstraints();

      expect(apiClient.get).toHaveBeenCalledWith("/constraints");
      expect(result).toEqual([
        {
          constraintId: 1,
          constraintType: "financial",
          description: "Budget limit",
          createdAt: "2026-07-01T00:00:00Z",
        },
      ]);
    });

    it("converts null/missing description to undefined", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            constraint_id: 2,
            constraint_type: "legal",
            description: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchAllConstraints();

      expect(result[0].description).toBeUndefined();
    });
  });

  describe("createConstraint", () => {
    it("sends camelCase input as snake_case and maps the response", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          constraint_id: 3,
          constraint_type: "operational",
          description: "New constraint",
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await createConstraint({
        constraintType: "operational",
        description: "New constraint",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/constraints", {
        constraint_type: "operational",
        description: "New constraint",
      });
      expect(result).toEqual({
        constraintId: 3,
        constraintType: "operational",
        description: "New constraint",
        createdAt: "2026-07-01T00:00:00Z",
      });
    });
  });

  describe("fetchConstraintsForDecision", () => {
    it("calls the correct endpoint with decisionId", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      await fetchConstraintsForDecision(42);

      expect(apiClient.get).toHaveBeenCalledWith("/constraints/decision/42");
    });

    it("maps returned constraints", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            constraint_id: 5,
            constraint_type: "financial",
            description: "Budget",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchConstraintsForDecision(1);

      expect(result[0].constraintId).toBe(5);
    });
  });

  describe("linkConstraintToDecision", () => {
    it("sends constraint_id in body to the correct endpoint", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          constraint_id: 7,
          constraint_type: "legal",
          description: null,
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await linkConstraintToDecision(10, 7);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/constraints/decision/10/link",
        { constraint_id: 7 }
      );
      expect(result.constraintId).toBe(7);
    });
  });

  describe("unlinkConstraintFromDecision", () => {
    it("calls delete with decisionId and constraintId in the path", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await unlinkConstraintFromDecision(10, 7);

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/constraints/decision/10/unlink/7"
      );
    });
  });
});