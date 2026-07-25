import { useQuery } from "@tanstack/react-query";
import { fetchDecisions, fetchDecisionById, fetchDecisionPolicyContext } from "@services/index";
import type { DecisionFilters } from "@services/index";
import { queryKeys, STALE_TIME } from "@app/queryClient";

export function useDecisionsList(filters: DecisionFilters) {
  return useQuery({
    queryKey: queryKeys.decisions.list(filters),
    queryFn: () => fetchDecisions(filters),
    staleTime: STALE_TIME.decisionDetail,
    placeholderData: (previousData) => previousData, // smooth pagination, no flash-to-empty
  });
}

export function useDecisionDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.decisions.detail(id ?? ""),
    queryFn: () => fetchDecisionById(id as string),
    staleTime: STALE_TIME.decisionDetail,
    enabled: Boolean(id),
  });
}

export function useDecisionPolicyContext(id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.decisions.detail(id ?? ""), "policy-context"],
    queryFn: () => fetchDecisionPolicyContext(id as string),
    staleTime: STALE_TIME.decisionDetail,
    enabled: Boolean(id),
  });
}
