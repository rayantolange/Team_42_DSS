import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocumentsForDecision,
  uploadDocumentToDecision,
  deleteDocument,
  fetchAllDocuments,
} from "@services/decisionDocumentService";
import type { DecisionDocument } from "@/types/domain";

// Polls every 3s while anything is still processing; stops once
// everything has settled into completed/failed, so we're not
// hammering the API forever after a document finishes.
function pollWhileProcessing(documents: DecisionDocument[] | undefined) {
  if (!documents) return false;
  const stillWorking = documents.some(
    (d) => d.status === "pending" || d.status === "processing",
  );
  return stillWorking ? 3000 : false;
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ["documents", "all"],
    queryFn: fetchAllDocuments,
    refetchInterval: (query) => pollWhileProcessing(query.state.data),
  });
}
export function useDecisionDocuments(decisionId: number) {
  return useQuery({
    queryKey: ["decisions", decisionId, "documents"],
    queryFn: () => fetchDocumentsForDecision(decisionId),
    enabled: !!decisionId,
    refetchInterval: (query) => pollWhileProcessing(query.state.data),
  });
}

export function useUploadDocument(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocumentToDecision(decisionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decisions", decisionId, "documents"],
      });
    },
  });
}

export function useDeleteDocument(decisionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decisions", decisionId, "documents"],
      });
    },
  });
}
