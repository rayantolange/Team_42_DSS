import { apiClient } from "./apiClient";
import type { Strategy, StrategyCreateInput } from "@/types/domain";

interface StrategyWire {
  strategy_id: number;
  strategy_name: string;
  description?: string | null;
  created_at: string;
}

function toStrategy(w: StrategyWire): Strategy {
  return {
    strategyId: w.strategy_id,
    strategyName: w.strategy_name,
    description: w.description ?? undefined,
    createdAt: w.created_at,
  };
}

export async function fetchAllStrategies(): Promise<Strategy[]> {
  const { data } = await apiClient.get<StrategyWire[]>("/strategies");
  return data.map(toStrategy);
}

export async function createStrategy(input: StrategyCreateInput): Promise<Strategy> {
  const { data } = await apiClient.post<StrategyWire>("/strategies", {
    strategy_name: input.strategyName,
    description: input.description,
  });
  return toStrategy(data);
}

export async function fetchStrategiesForDecision(decisionId: number): Promise<Strategy[]> {
  const { data } = await apiClient.get<StrategyWire[]>(
    `/decisions/${decisionId}/strategies`
  );
  return data.map(toStrategy);
}

export async function linkStrategyToDecision(
  decisionId: number,
  strategyId: number
): Promise<Strategy> {
  const { data } = await apiClient.post<StrategyWire>(
    `/decisions/${decisionId}/strategies`,
    { strategy_id: strategyId }
  );
  return toStrategy(data);
}

export async function unlinkStrategyFromDecision(
  decisionId: number,
  strategyId: number
): Promise<void> {
  await apiClient.delete(`/decisions/${decisionId}/strategies/${strategyId}`);
}