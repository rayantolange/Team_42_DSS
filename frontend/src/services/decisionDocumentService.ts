import { apiClient } from "./apiClient";
import type { DecisionDocument, DocumentStatus } from "@/types/domain";

interface DocumentSummaryWire {
  document_id: number;
  file_name: string;
  uploaded_by: number;
  upload_date?: string | null;
  created_at: string;
  status: DocumentStatus;
  status_message?: string | null;
}

interface DocumentResponseWire extends DocumentSummaryWire {
  decision_id: number;
  file_path: string;
}

function toDocSummary(
  w: DocumentSummaryWire,
  decisionId: number,
): DecisionDocument {
  return {
    documentId: w.document_id,
    decisionId,
    uploadedBy: w.uploaded_by,
    fileName: w.file_name,
    uploadDate: w.upload_date ?? undefined,
    createdAt: w.created_at,
    status: w.status,
    statusMessage: w.status_message ?? undefined,
  };
}

function toDocResponse(w: DocumentResponseWire): DecisionDocument {
  return {
    documentId: w.document_id,
    decisionId: w.decision_id,
    uploadedBy: w.uploaded_by,
    fileName: w.file_name,
    filePath: w.file_path,
    uploadDate: w.upload_date ?? undefined,
    createdAt: w.created_at,
    status: w.status,
    statusMessage: w.status_message ?? undefined,
  };
}

export async function fetchDocumentsForDecision(
  decisionId: number,
): Promise<DecisionDocument[]> {
  const { data } = await apiClient.get<DocumentSummaryWire[]>(
    `/decisions/${decisionId}/documents`,
  );
  return data.map((w) => toDocSummary(w, decisionId));
}

export async function uploadDocumentToDecision(
  decisionId: number,
  file: File,
): Promise<DecisionDocument> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<DocumentResponseWire>(
    `/decisions/${decisionId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return toDocResponse(data);
}

export async function deleteDocument(documentId: number): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}

export async function getDocumentDownloadUrl(
  documentId: number,
): Promise<string> {
  const { data } = await apiClient.get<{ url: string }>(
    `/documents/${documentId}/download-url`,
  );
  return data.url;
}

export async function fetchAllDocuments(): Promise<DecisionDocument[]> {
  const { data } = await apiClient.get<
    Array<{
      document_id: number;
      file_name: string;
      uploaded_by: number;
      upload_date?: string | null;
      created_at: string;
      decision_id: number;
      status: DocumentStatus;
      status_message?: string | null;
    }>
  >("/documents");

  return data.map((w) => ({
    documentId: w.document_id,
    decisionId: w.decision_id,
    uploadedBy: w.uploaded_by,
    fileName: w.file_name,
    uploadDate: w.upload_date ?? undefined,
    createdAt: w.created_at,
    status: w.status,                              
    statusMessage: w.status_message ?? undefined,
  }));
}
