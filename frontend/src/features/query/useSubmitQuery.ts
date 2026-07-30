import { useMutation } from "@tanstack/react-query";
import { createThread, sendMessage } from "@services/index";
import { useQueryStore, makeMessageId, titleFromText } from "@store/queryStore";

const MODE_MAP = { search: "rag_search", chat: "chat" } as const;

export function useSubmitQuery() {
  const addMessageToConversation = useQueryStore((s) => s.addMessageToConversation);
  const getThreadId = useQueryStore((s) => s.getThreadId);
  const setThreadId = useQueryStore((s) => s.setThreadId);
  const mode = useQueryStore((s) => s.mode);

  return useMutation({
    mutationFn: async ({
      conversationId,
      queryText,
    }: {
      conversationId: string;
      queryText: string;
    }) => {
      addMessageToConversation(conversationId, {
        id: makeMessageId(),
        role: "user",
        text: queryText,
        createdAt: new Date().toISOString(),
      });

      let threadId = getThreadId(conversationId);
      if (threadId === undefined) {
        threadId = await createThread(titleFromText(queryText));
        setThreadId(conversationId, threadId);
      }

      const result = await sendMessage(threadId, queryText, MODE_MAP[mode]);
      return { conversationId, result };
    },
    onSuccess: ({ conversationId, result }) => {
      addMessageToConversation(conversationId, {
        id: makeMessageId(),
        role: "assistant",
        text: result.answer,
        createdAt: new Date().toISOString(),
        sources: result.sources,
        confidenceScore: result.confidenceScore,
        confidenceLevel: result.confidenceLevel,
      });
    },
  });
}