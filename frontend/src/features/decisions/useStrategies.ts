import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllStrategies,
  createStrategy,
  fetchStrategiesForDecision,
  linkStrategyToDecision,
  unlinkStrategyFromDecision,
} from "@services/strategyService";
import type { StrategyCreateInput } from "@/types/domain";

export function useAllStrategies() {
  return useQuery({
    queryKey: ["strategies", "all"],
    queryFn: fetchAllStrategies,
  });
}

export function useStrategiesForDecision(decisionId: number) {
  return useQuery({
    queryKey: ["decisions", decisionId, "strategies"],
    queryFn: () => fetchStrategiesForDecision(decisionId),
    enabled: !!decisionId,
  });
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StrategyCreateInput) => createStrategy(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies", "all"] });
    },
  });
}

export function useLinkStrategy(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: number) => linkStrategyToDecision(decisionId, strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", decisionId, "strategies"] });
    },
  });
}

export function useUnlinkStrategy(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: number) => unlinkStrategyFromDecision(decisionId, strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", decisionId, "strategies"] });
    },
  });
}