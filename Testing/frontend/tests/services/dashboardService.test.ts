import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import { fetchDashboardMetrics } from "./dashboardService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDashboardMetrics", () => {
    it("maps top-level snake_case metrics to camelCase", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 120,
          pending_decisions: 15,
          documents_indexed: 340,
          positive_outcome_rate: 0.82,
          outcome_coverage_percent: 65,
          outcome_breakdown: [],
          decision_trends: [],
          department_comparison: [],
          recent_decisions: [],
        },
      });

      const result = await fetchDashboardMetrics();

      expect(result.totalDecisions).toBe(120);
      expect(result.pendingDecisions).toBe(15);
      expect(result.documentsIndexed).toBe(340);
      expect(result.positiveOutcomeRate).toBe(0.82);
      expect(result.outcomeCoveragePercent).toBe(65);
    });

    it("maps outcome_breakdown entries directly", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 0,
          pending_decisions: 0,
          documents_indexed: 0,
          positive_outcome_rate: 0,
          outcome_coverage_percent: 0,
          outcome_breakdown: [
            { status: "successful", count: 10 },
            { status: "failed", count: 2 },
          ],
          decision_trends: [],
          department_comparison: [],
          recent_decisions: [],
        },
      });

      const result = await fetchDashboardMetrics();

      expect(result.outcomeBreakdown).toEqual([
        { status: "successful", count: 10 },
        { status: "failed", count: 2 },
      ]);
    });

    it("pivots decision_trends into one row per month with status columns", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 0,
          pending_decisions: 0,
          documents_indexed: 0,
          positive_outcome_rate: 0,
          outcome_coverage_percent: 0,
          outcome_breakdown: [],
          decision_trends: [
            { month: "2026-01", status: "draft", count: 5 },
            { month: "2026-01", status: "approved", count: 3 },
            { month: "2026-02", status: "implemented", count: 8 },
          ],
          department_comparison: [],
          recent_decisions: [],
        },
      });

      const result = await fetchDashboardMetrics();

      expect(result.decisionTrends).toEqual([
        {
          month: "2026-01",
          draft: 5,
          approved: 3,
          implemented: 0,
          completed: 0,
          cancelled: 0,
        },
        {
          month: "2026-02",
          draft: 0,
          approved: 0,
          implemented: 8,
          completed: 0,
          cancelled: 0,
        },
      ]);
    });

    it("sorts pivoted decision_trends by month ascending", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 0,
          pending_decisions: 0,
          documents_indexed: 0,
          positive_outcome_rate: 0,
          outcome_coverage_percent: 0,
          outcome_breakdown: [],
          decision_trends: [
            { month: "2026-03", status: "draft", count: 1 },
            { month: "2026-01", status: "draft", count: 2 },
            { month: "2026-02", status: "draft", count: 3 },
          ],
          department_comparison: [],
          recent_decisions: [],
        },
      });

      const result = await fetchDashboardMetrics();

      expect(result.decisionTrends.map((t) => t.month)).toEqual([
        "2026-01",
        "2026-02",
        "2026-03",
      ]);
    });

    it("pivots department_comparison into one row per department with outcome columns", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 0,
          pending_decisions: 0,
          documents_indexed: 0,
          positive_outcome_rate: 0,
          outcome_coverage_percent: 0,
          outcome_breakdown: [],
          decision_trends: [],
          department_comparison: [
            {
              department_id: 1,
              department_name: "IT",
              status: "successful",
              count: 6,
            },
            {
              department_id: 1,
              department_name: "IT",
              status: "failed",
              count: 1,
            },
            {
              department_id: 2,
              department_name: "HR",
              status: "partially_successful",
              count: 4,
            },
          ],
          recent_decisions: [],
        },
      });

      const result = await fetchDashboardMetrics();

      expect(result.departmentComparison).toEqual([
        {
          departmentId: 1,
          departmentName: "IT",
          successful: 6,
          partiallySuccessful: 0,
          failed: 1,
        },
        {
          departmentId: 2,
          departmentName: "HR",
          successful: 0,
          partiallySuccessful: 4,
          failed: 0,
        },
      ]);
    });

    it("maps recent_decisions snake_case fields to camelCase", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 0,
          pending_decisions: 0,
          documents_indexed: 0,
          positive_outcome_rate: 0,
          outcome_coverage_percent: 0,
          outcome_breakdown: [],
          decision_trends: [],
          department_comparison: [],
          recent_decisions: [
            {
              decision_id: 99,
              title: "Upgrade Server",
              department_name: "IT",
              status: "approved",
              created_at: "2026-07-15T00:00:00Z",
            },
          ],
        },
      });

      const result = await fetchDashboardMetrics();

      expect(result.recentDecisions).toEqual([
        {
          decisionId: 99,
          title: "Upgrade Server",
          departmentName: "IT",
          status: "approved",
          createdAt: "2026-07-15T00:00:00Z",
        },
      ]);
    });

    it("calls the correct endpoint", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          total_decisions: 0,
          pending_decisions: 0,
          documents_indexed: 0,
          positive_outcome_rate: 0,
          outcome_coverage_percent: 0,
          outcome_breakdown: [],
          decision_trends: [],
          department_comparison: [],
          recent_decisions: [],
        },
      });

      await fetchDashboardMetrics();

      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/metrics");
    });
  });
});