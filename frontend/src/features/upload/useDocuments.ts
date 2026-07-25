import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDocuments, deleteDocument } from "@services/index";
import { queryKeys } from "@app/queryClient";
import { useToast } from "@components/ui/Toast";

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents.list(),
    queryFn: fetchDocuments,
    staleTime: 0, // always reflect the latest upload state
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
      showToast({ title: "Document removed", description: "It no longer informs decision context.", variant: "info" });
    },
    onError: (err: unknown) => {
      showToast({
        title: "Couldn't remove document",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    },
  });
}
