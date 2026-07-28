import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocumentsForDecision,
  uploadDocumentToDecision,
  deleteDocument,
} from "@services/decisionDocumentService";

export function useDecisionDocuments(decisionId: number) {
  return useQuery({
    queryKey: ["decisions", decisionId, "documents"],
    queryFn: () => fetchDocumentsForDecision(decisionId),
    enabled: !!decisionId,
  });
}

export function useUploadDocument(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocumentToDecision(decisionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", decisionId, "documents"] });
    },
  });
}

export function useDeleteDocument(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", decisionId, "documents"] });
    },
  });
}