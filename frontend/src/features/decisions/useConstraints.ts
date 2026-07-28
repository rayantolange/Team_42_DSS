import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllConstraints,
  createConstraint,
  fetchConstraintsForDecision,
  linkConstraintToDecision,
  unlinkConstraintFromDecision,
} from "@services/constraintService";
import type { ConstraintCreateInput } from "@/types/domain";

export function useAllConstraints() {
  return useQuery({
    queryKey: ["constraints", "all"],
    queryFn: fetchAllConstraints,
  });
}

export function useConstraintsForDecision(decisionId: number) {
  return useQuery({
    queryKey: ["decisions", decisionId, "constraints"],
    queryFn: () => fetchConstraintsForDecision(decisionId),
    enabled: !!decisionId,
  });
}

export function useCreateConstraint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConstraintCreateInput) => createConstraint(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constraints", "all"] });
    },
  });
}

export function useLinkConstraint(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (constraintId: number) => linkConstraintToDecision(decisionId, constraintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", decisionId, "constraints"] });
    },
  });
}

export function useUnlinkConstraint(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (constraintId: number) => unlinkConstraintFromDecision(decisionId, constraintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", decisionId, "constraints"] });
    },
  });
}