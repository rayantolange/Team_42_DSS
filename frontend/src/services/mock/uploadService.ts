import type { UploadedDocument } from "@/types/domain";
import { mockDelay } from "./mockUtils";

/**
 * In-memory store standing in for the backend document table.
 * Resets on page reload — acceptable for a mock service; replace
 * with real persisted state once the FastAPI upload endpoint exists.
 */
let documentStore: UploadedDocument[] = [];

export async function fetchDocuments(): Promise<UploadedDocument[]> {
  await mockDelay(300);
  return documentStore;
}

interface UploadOptions {
  file: File;
  onProgress?: (percent: number) => void;
  linkedPolicyId?: string;
}

const ALLOWED_TYPE = "application/pdf";
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export function validateFile(file: File): string | null {
  if (file.type !== ALLOWED_TYPE) {
    return "Only PDF files are supported.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "File exceeds the 25MB size limit.";
  }
  return null;
}

/**
 * Simulates a chunked upload with progress callbacks, then a brief
 * "processing" phase (standing in for backend ingestion into the
 * RAG corpus / knowledge graph), finishing in "complete" or "error".
 */
export async function uploadDocument({
  file,
  onProgress,
  linkedPolicyId,
}: UploadOptions): Promise<UploadedDocument> {
  const validationError = validateFile(file);

  const doc: UploadedDocument = {
    id: `DOC-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    fileName: file.name,
    fileSizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    status: "uploading",
    linkedPolicyId,
  };

  if (validationError) {
    doc.status = "error";
    doc.errorMessage = validationError;
    documentStore = [doc, ...documentStore];
    return doc;
  }

  documentStore = [doc, ...documentStore];

  // Simulate progressive upload
  for (let pct = 10; pct <= 100; pct += 15) {
    await mockDelay(150);
    onProgress?.(Math.min(pct, 100));
  }

  doc.status = "processing";
  await mockDelay(600);

  doc.status = "complete";
  documentStore = documentStore.map((d) => (d.id === doc.id ? doc : d));

  return doc;
}

export async function deleteDocument(id: string): Promise<void> {
  await mockDelay(200);
  documentStore = documentStore.filter((d) => d.id !== id);
}
