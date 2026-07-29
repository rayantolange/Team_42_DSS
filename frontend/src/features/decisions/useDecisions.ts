import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDecisions,
  fetchDecisionById,
  createDecision,
  updateDecision,
  updateDecisionStatus,
  type DecisionFilters,
} from "@services/decisionService";
import type {
  DecisionCreateInput,
  DecisionUpdateInput,
  DecisionRecordStatus,
} from "@/types/domain";

const decisionKeys = {
  all: ["decisions"] as const,
  list: (filters: DecisionFilters) => [...decisionKeys.all, "list", filters] as const,
  detail: (id: number) => [...decisionKeys.all, "detail", id] as const,
};

export function useDecisions(filters: DecisionFilters = {}) {
  return useQuery({
    queryKey: decisionKeys.list(filters),
    queryFn: () => fetchDecisions(filters),
  });
}

export function useDecision(decisionId: number) {
  return useQuery({
    queryKey: decisionKeys.detail(decisionId),
    queryFn: () => fetchDecisionById(decisionId),
    enabled: !!decisionId,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DecisionCreateInput) => createDecision(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.all });
    },
  });
}

export function useUpdateDecision(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DecisionUpdateInput) => updateDecision(decisionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.detail(decisionId) });
      queryClient.invalidateQueries({ queryKey: decisionKeys.all });
    },
  });
}

export function useUpdateDecisionStatus(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newStatus: DecisionRecordStatus) =>
      updateDecisionStatus(decisionId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.detail(decisionId) });
      queryClient.invalidateQueries({ queryKey: decisionKeys.all });
    },
  });
}