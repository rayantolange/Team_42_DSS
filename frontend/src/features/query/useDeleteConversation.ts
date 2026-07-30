import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteThreadRemote } from "@services/index";
import { useQueryStore } from "@store/queryStore";

export function useDeleteConversation() {
  const deleteConversation = useQueryStore((s) => s.deleteConversation);
  const getThreadId = useQueryStore((s) => s.getThreadId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const threadId = getThreadId(conversationId);
      if (threadId !== undefined) await deleteThreadRemote(threadId);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      deleteConversation(conversationId);
      queryClient.invalidateQueries({ queryKey: ["chatThreads"] });
    },
  });
}