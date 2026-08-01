import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  fetchAllStrategies,
  createStrategy,
  fetchStrategiesForDecision,
  linkStrategyToDecision,
  unlinkStrategyFromDecision,
} from "./strategyService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("strategyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAllStrategies", () => {
    it("maps snake_case fields to camelCase", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            strategy_id: 1,
            strategy_name: "Phased Rollout",
            description: "Roll out in phases",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchAllStrategies();

      expect(apiClient.get).toHaveBeenCalledWith("/strategies");
      expect(result).toEqual([
        {
          strategyId: 1,
          strategyName: "Phased Rollout",
          description: "Roll out in phases",
          createdAt: "2026-07-01T00:00:00Z",
        },
      ]);
    });

    it("converts null description to undefined", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            strategy_id: 2,
            strategy_name: "Direct Cutover",
            description: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchAllStrategies();

      expect(result[0].description).toBeUndefined();
    });
  });

  describe("createStrategy", () => {
    it("sends camelCase input as snake_case and maps the response", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          strategy_id: 3,
          strategy_name: "New Strategy",
          description: "A new approach",
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await createStrategy({
        strategyName: "New Strategy",
        description: "A new approach",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/strategies", {
        strategy_name: "New Strategy",
        description: "A new approach",
      });
      expect(result.strategyId).toBe(3);
    });
  });

  describe("fetchStrategiesForDecision", () => {
    it("calls the correct decision-scoped endpoint", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      await fetchStrategiesForDecision(42);

      expect(apiClient.get).toHaveBeenCalledWith("/decisions/42/strategies");
    });

    it("maps returned strategies", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            strategy_id: 6,
            strategy_name: "Phased Rollout",
            description: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const result = await fetchStrategiesForDecision(1);

      expect(result[0].strategyId).toBe(6);
    });
  });

  describe("linkStrategyToDecision", () => {
    it("sends strategy_id in body to the decision's strategies endpoint", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          strategy_id: 8,
          strategy_name: "Existing Strategy",
          description: null,
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await linkStrategyToDecision(10, 8);

      expect(apiClient.post).toHaveBeenCalledWith("/decisions/10/strategies", {
        strategy_id: 8,
      });
      expect(result.strategyId).toBe(8);
    });
  });

  describe("unlinkStrategyFromDecision", () => {
    it("calls delete with decisionId and strategyId in the path", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await unlinkStrategyFromDecision(10, 8);

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/decisions/10/strategies/8"
      );
    });
  });
});