// src/features/graph/useGraphData.ts
import { useQuery } from "@tanstack/react-query";
import { fetchDecisions } from "@services/decisionService";
import { fetchStrategiesForDecision } from "@services/strategyService";
import { fetchConstraintsForDecision } from "@services/constraintService";
import { fetchOutcomesForDecision } from "@services/outcomeService";
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
    queryFn: async (): Promise<RawGraphData> => {
      const decisions = (await fetchDecisions({ statusFilter, limit: 200 })) ?? [];

      const linksByDecision: RawGraphData["linksByDecision"] = {};

      // Fetch each decision's links in parallel. Fine for a project
      // this size; would need a bulk backend endpoint at real scale.
      await Promise.all(
        decisions.map(async (d) => {
          const [strategies, constraints, outcomes] = await Promise.all([
            fetchStrategiesForDecision(d.decisionId),
            fetchConstraintsForDecision(d.decisionId),
            fetchOutcomesForDecision(d.decisionId),
          ]);
          linksByDecision[d.decisionId] = {
            strategies: strategies.map((s) => ({
              strategyId: s.strategyId,
              strategyName: s.strategyName,
            })),
            constraints: constraints.map((c) => ({
              constraintId: c.constraintId,
              constraintType: c.constraintType,
            })),
            outcomes: outcomes.map((o) => ({
              outcomeId: o.outcomeId,
              outcomeStatus: o.outcomeStatus,
            })),
          };
        })
      );

      return {
        decisions: decisions.map((d) => ({
          decisionId: d.decisionId,
          title: d.title,
          decisionType: d.decisionType,
          status: d.status,
        })),
        linksByDecision,
      };
    },
  });
}