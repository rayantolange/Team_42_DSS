import { apiClient } from "./apiClient";
import type { ConstraintItem, ConstraintCreateInput, ConstraintType } from "@/types/domain";

interface ConstraintWire {
  constraint_id: number;
  constraint_type: ConstraintType;
  description?: string | null;
  created_at: string;
}

function toConstraint(w: ConstraintWire): ConstraintItem {
  return {
    constraintId: w.constraint_id,
    constraintType: w.constraint_type,
    description: w.description ?? undefined,
    createdAt: w.created_at,
  };
}

export async function fetchAllConstraints(): Promise<ConstraintItem[]> {
  const { data } = await apiClient.get<ConstraintWire[]>("/constraints");
  return data.map(toConstraint);
}

export async function createConstraint(input: ConstraintCreateInput): Promise<ConstraintItem> {
  const { data } = await apiClient.post<ConstraintWire>("/constraints", {
    constraint_type: input.constraintType,
    description: input.description,
  });
  return toConstraint(data);
}

export async function fetchConstraintsForDecision(decisionId: number): Promise<ConstraintItem[]> {
  const { data } = await apiClient.get<ConstraintWire[]>(
    `/constraints/decision/${decisionId}`
  );
  return data.map(toConstraint);
}

export async function linkConstraintToDecision(
  decisionId: number,
  constraintId: number
): Promise<ConstraintItem> {
  const { data } = await apiClient.post<ConstraintWire>(
    `/constraints/decision/${decisionId}/link`,
    { constraint_id: constraintId }
  );
  return toConstraint(data);
}

export async function unlinkConstraintFromDecision(
  decisionId: number,
  constraintId: number
): Promise<void> {
  await apiClient.delete(`/constraints/decision/${decisionId}/unlink/${constraintId}`);
}