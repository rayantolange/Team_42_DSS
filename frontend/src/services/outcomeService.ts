import { apiClient } from "./apiClient";
import type { Outcome, OutcomeCreateInput, OutcomeStatus } from "@/types/domain";

interface OutcomeWire {
  outcome_id: number;
  decision_id: number;
  outcome_status: OutcomeStatus;
  outcome_desc?: string | null;
  success_score?: number | string | null;
  evaluation_date?: string | null;
  created_at: string;
}

function toOutcome(w: OutcomeWire): Outcome {
  return {
    outcomeId: w.outcome_id,
    decisionId: w.decision_id,
    outcomeStatus: w.outcome_status,
    outcomeDesc: w.outcome_desc ?? undefined,
    successScore: w.success_score != null ? Number(w.success_score) : undefined,
    evaluationDate: w.evaluation_date ?? undefined,
    createdAt: w.created_at,
  };
}

export async function fetchOutcomesForDecision(decisionId: number): Promise<Outcome[]> {
  const { data } = await apiClient.get<OutcomeWire[]>(
    `/decisions/${decisionId}/outcomes`
  );
  return data.map(toOutcome);
}

export async function createOutcome(
  decisionId: number,
  input: OutcomeCreateInput
): Promise<Outcome> {
  const { data } = await apiClient.post<OutcomeWire>(
    `/decisions/${decisionId}/outcomes`,
    {
      outcome_status: input.outcomeStatus,
      outcome_desc: input.outcomeDesc,
      success_score: input.successScore,
      evaluation_date: input.evaluationDate,
    }
  );
  return toOutcome(data);
}

export async function deleteOutcome(outcomeId: number): Promise<void> {
  await apiClient.delete(`/outcomes/${outcomeId}`);
}