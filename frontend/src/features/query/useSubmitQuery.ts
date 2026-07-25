import { useMutation } from "@tanstack/react-query";
import { submitQuery } from "@services/index";
import { useQueryStore } from "@store/queryStore";

/**
 * Query submission is modeled as a mutation (not a query) because
 * it's a user-triggered action with side effects (added to history),
 * not idempotent data fetching keyed by stable params. staleTime: 0
 * per the spec is naturally satisfied since mutations never cache.
 */
export function useSubmitQuery() {
  const setCurrentResult = useQueryStore((s) => s.setCurrentResult);
  const addToHistory = useQueryStore((s) => s.addToHistory);

  return useMutation({
    mutationFn: ({ queryText, departmentId }: { queryText: string; departmentId?: string }) =>
      submitQuery(queryText, departmentId),
    onSuccess: (result) => {
      setCurrentResult(result);
      addToHistory(result);
    },
  });
}
