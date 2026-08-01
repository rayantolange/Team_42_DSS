import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  fetchOutcomesForDecision,
  createOutcome,
  deleteOutcome,
  fetchAllOutcomes,
} from "./outcomeService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("outcomeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchOutcomesForDecision", () => {
    it("maps snake_case fields to camelCase", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            outcome_id: 1,
            decision_id: 42,
            outcome_status: "successful",
            outcome_desc: "Went well",
            success_score: 85,
            evaluation_date: "2026-07-01",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchOutcomesForDecision(42);

      expect(apiClient.get).toHaveBeenCalledWith("/decisions/42/outcomes");
      expect(result).toEqual([
        {
          outcomeId: 1,
          decisionId: 42,
          outcomeStatus: "successful",
          outcomeDesc: "Went well",
          successScore: 85,
          evaluationDate: "2026-07-01",
          createdAt: "2026-07-01T00:00:00Z",
        },
      ]);
    });

    it("converts a string success_score to a number", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            outcome_id: 2,
            decision_id: 1,
            outcome_status: "partially_successful",
            outcome_desc: null,
            success_score: "72.5",
            evaluation_date: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchOutcomesForDecision(1);

      expect(result[0].successScore).toBe(72.5);
      expect(typeof result[0].successScore).toBe("number");
    });

    it("converts null success_score to undefined, not zero", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            outcome_id: 3,
            decision_id: 1,
            outcome_status: "failed",
            outcome_desc: null,
            success_score: null,
            evaluation_date: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchOutcomesForDecision(1);

      expect(result[0].successScore).toBeUndefined();
    });

    it("preserves a success_score of 0 (does not treat it as falsy)", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            outcome_id: 4,
            decision_id: 1,
            outcome_status: "failed",
            outcome_desc: null,
            success_score: 0,
            evaluation_date: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchOutcomesForDecision(1);

      expect(result[0].successScore).toBe(0);
    });
  });

  describe("createOutcome", () => {
    it("sends camelCase input as snake_case to the decision's outcomes endpoint", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          outcome_id: 5,
          decision_id: 10,
          outcome_status: "successful",
          outcome_desc: "Great result",
          success_score: 90,
          evaluation_date: "2026-07-01",
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await createOutcome(10, {
        outcomeStatus: "successful",
        outcomeDesc: "Great result",
        successScore: 90,
        evaluationDate: "2026-07-01",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/decisions/10/outcomes", {
        outcome_status: "successful",
        outcome_desc: "Great result",
        success_score: 90,
        evaluation_date: "2026-07-01",
      });
      expect(result.outcomeId).toBe(5);
    });
  });

  describe("deleteOutcome", () => {
    it("calls delete with the correct outcome endpoint", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await deleteOutcome(7);

      expect(apiClient.delete).toHaveBeenCalledWith("/outcomes/7");
    });
  });

  describe("fetchAllOutcomes", () => {
    it("calls /outcomes and maps the results", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            outcome_id: 1,
            decision_id: 1,
            outcome_status: "successful",
            outcome_desc: null,
            success_score: null,
            evaluation_date: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchAllOutcomes();

      expect(apiClient.get).toHaveBeenCalledWith("/outcomes");
      expect(result[0].outcomeId).toBe(1);
    });
  });
});