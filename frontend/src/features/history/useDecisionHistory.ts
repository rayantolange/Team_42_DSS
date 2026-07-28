import { useQuery } from "@tanstack/react-query";
import { fetchDecisions, fetchDecisionById } from "@services/decisionService";
import type { DecisionFilters } from "@services/decisionService";

export function useDecisionsList(filters: DecisionFilters) {
  return useQuery({
    queryKey: ["decisions", "history-list", filters],
    queryFn: () => fetchDecisions(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useDecisionDetail(id: number | null) {
  return useQuery({
    queryKey: ["decisions", "detail", id],
    queryFn: () => fetchDecisionById(id as number),
    enabled: id !== null,
  });
}
