import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  fetchDecisions,
  fetchDecisionById,
  createDecision,
  fetchGraphData,
} from "./decisionService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("decisionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDecisions", () => {
    it("maps snake_case wire fields to camelCase", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            decision_id: 42,
            title: "Switch WiFi Provider",
            decision_type: "infrastructure",
            status: "draft",
            decision_date: "2026-08-01",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchDecisions();

      expect(result).toEqual([
        {
          decisionId: 42,
          title: "Switch WiFi Provider",
          decisionType: "infrastructure",
          status: "draft",
          decisionDate: "2026-08-01",
          createdAt: "2026-07-01T00:00:00Z",
        },
      ]);
    });

    it("converts null decision_type/decision_date to undefined, not null", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            decision_id: 1,
            title: "No type or date",
            decision_type: null,
            status: "draft",
            decision_date: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchDecisions();

      expect(result[0]?.decisionType).toBeUndefined();
      expect(result[0]?.decisionDate).toBeUndefined();
    });

    it("sends default skip/limit and passes through statusFilter", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      await fetchDecisions({ statusFilter: "approved" });

      expect(apiClient.get).toHaveBeenCalledWith("/decisions/", {
        params: { status_filter: "approved", skip: 0, limit: 100 },
      });
    });
  });

  describe("fetchDecisionById", () => {
    it("maps the full decision response, including departmentId/createdBy", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          decision_id: 7,
          department_id: 3,
          created_by: 18,
          title: "Full Decision",
          problem_statement: "A problem statement.",
          decision_desc: "A decision description.",
          decision_type: "academic",
          status: "approved",
          decision_date: "2026-06-01",
          created_at: "2026-05-01T00:00:00Z",
          updated_at: "2026-05-02T00:00:00Z",
        },
      });

      const result = await fetchDecisionById(7);

      expect(result).toEqual({
        decisionId: 7,
        departmentId: 3,
        createdBy: 18,
        title: "Full Decision",
        problemStatement: "A problem statement.",
        decisionDesc: "A decision description.",
        decisionType: "academic",
        status: "approved",
        decisionDate: "2026-06-01",
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-05-02T00:00:00Z",
      });
    });
  });

  describe("createDecision", () => {
    it("sends camelCase input as snake_case to the API", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          decision_id: 1,
          department_id: 1,
          created_by: 1,
          title: "New Decision",
          problem_statement: "A problem.",
          decision_desc: "A description.",
          decision_type: null,
          status: "draft",
          decision_date: null,
          created_at: "2026-07-01T00:00:00Z",
          updated_at: "2026-07-01T00:00:00Z",
        },
      });

      await createDecision({
        title: "New Decision",
        problemStatement: "A problem.",
        decisionDesc: "A description.",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/decisions/", {
        title: "New Decision",
        problem_statement: "A problem.",
        decision_desc: "A description.",
        decision_type: undefined,
        decision_date: undefined,
      });
    });
  });

  describe("fetchGraphData", () => {
    it("maps nested decisions and links_by_decision correctly", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          decisions: [
            { decision_id: 1, title: "Decision One", decision_type: null, status: "draft" },
          ],
          links_by_decision: {
            1: {
              strategies: [{ strategy_id: 10, strategy_name: "Phased Rollout" }],
              constraints: [{ constraint_id: 20, constraint_type: "financial" }],
              outcomes: [{ outcome_id: 30, outcome_status: "successful" }],
            },
          },
        },
      });

      const result = await fetchGraphData();

      expect(result.decisions).toEqual([
        { decisionId: 1, title: "Decision One", decisionType: undefined, status: "draft" },
      ]);
      expect(result.linksByDecision[1]).toEqual({
        strategies: [{ strategyId: 10, strategyName: "Phased Rollout" }],
        constraints: [{ constraintId: 20, constraintType: "financial" }],
        outcomes: [{ outcomeId: 30, outcomeStatus: "successful" }],
      });
    });
  });
});