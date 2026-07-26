import { useMutation } from "@tanstack/react-query";
import { submitQuery } from "@services/index";
import { useQueryStore, makeMessageId } from "@store/queryStore";

/**
 * Query submission is modeled as a mutation (not a query) because
 * it's a user-triggered action with side effects (added to history),
 * not idempotent data fetching keyed by stable params. staleTime: 0
 * per the spec is naturally satisfied since mutations never cache.
 */
export function useSubmitQuery() {
  const setCurrentResult = useQueryStore((s) => s.setCurrentResult);
  const addToHistory = useQueryStore((s) => s.addToHistory);
  const addMessage = useQueryStore((s) => s.addMessage);
  const mode = useQueryStore((s) => s.mode);

  return useMutation({
    mutationFn: async ({ queryText, departmentId }: { queryText: string; departmentId?: string }) => {
      // Always record the user's message immediately, regardless of mode.
      addMessage({
        id: makeMessageId(),
        role: "user",
        text: queryText,
        createdAt: new Date().toISOString(),
      });

      if (mode === "chat") {
        // No retrieval — just continue the conversation using existing
        // context. Mocked for now until a real chat-continuation
        // endpoint exists.
        await new Promise((resolve) => setTimeout(resolve, 700));
        return {
          type: "chat" as const,
          text: `(Mock chat reply) Continuing from what we discussed — could you clarify what part of the previous answer you'd like me to expand on?`,
        };
      }

      // Search mode — real retrieval + answer.
      const result = await submitQuery(queryText, departmentId);
      return { type: "search" as const, result };
    },
    onSuccess: (data) => {
      if (data.type === "search") {
        setCurrentResult(data.result);
        addToHistory(data.result);
        addMessage({
          id: makeMessageId(),
          role: "assistant",
          text: data.result.answer,
          createdAt: new Date().toISOString(),
          sources: data.result.sources,
          confidenceScore: data.result.confidenceScore,
          confidenceLevel: data.result.confidenceLevel,
        });
      } else {
        addMessage({
          id: makeMessageId(),
          role: "assistant",
          text: data.text,
          createdAt: new Date().toISOString(),
        });
      }
    },
  });
}