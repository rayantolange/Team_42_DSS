// src/features/graph/useGraphData.ts
import { useQuery } from "@tanstack/react-query";
import { fetchGraphData } from "@services/decisionService";
import type { DecisionRecordStatus } from "@/types/domain";

export interface GraphNodeData {
  entityType: GraphEntityType;
  label: string;
  entityId: string;
  subtitle?: string;
  status?: string;
}

export type GraphEntityType = "decision" | "strategy" | "constraint" | "outcome";

export interface RawGraphData {
  decisions: Array<{
    decisionId: number;
    title: string;
    decisionType?: string;
    status: DecisionRecordStatus;
  }>;
  linksByDecision: Record<
    number,
    {
      strategies: { strategyId: number; strategyName: string }[];
      constraints: { constraintId: number; constraintType: string }[];
      outcomes: { outcomeId: number; outcomeStatus: string }[];
    }
  >;
}

export function useGraphData(statusFilter?: DecisionRecordStatus) {
  return useQuery({
    queryKey: ["graph-data", statusFilter],
    queryFn: () => fetchGraphData(statusFilter),
  });
}