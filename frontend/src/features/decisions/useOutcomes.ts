import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOutcomesForDecision,
  createOutcome,
  deleteOutcome,
  fetchAllOutcomes,
} from "@services/outcomeService";
import type { OutcomeCreateInput } from "@/types/domain";

export function useAllOutcomes() {
  return useQuery({
    queryKey: ["outcomes", "all"],
    queryFn: fetchAllOutcomes,
  });
}

export function useOutcomesForDecision(decisionId: number) {
  return useQuery({
    queryKey: ["decisions", decisionId, "outcomes"],
    queryFn: () => fetchOutcomesForDecision(decisionId),
    enabled: !!decisionId,
  });
}

export function useCreateOutcome(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OutcomeCreateInput) => createOutcome(decisionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decisions", decisionId, "outcomes"],
      });
    },
  });
}

export function useDeleteOutcome(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outcomeId: number) => deleteOutcome(outcomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decisions", decisionId, "outcomes"],
      });
    },
  });
}
