import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  fetchDocumentsForDecision,
  uploadDocumentToDecision,
  deleteDocument,
  getDocumentDownloadUrl,
  fetchAllDocuments,
} from "./decisionDocumentService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("decisionDocumentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDocumentsForDecision", () => {
    it("maps summary fields and attaches the passed-in decisionId", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            document_id: 1,
            file_name: "policy.pdf",
            uploaded_by: 3,
            upload_date: "2026-07-01",
            created_at: "2026-07-01T00:00:00Z",
            status: "processed",
            status_message: null,
          },
        ],
      });

      const result = await fetchDocumentsForDecision(42);

      expect(apiClient.get).toHaveBeenCalledWith("/decisions/42/documents");
      expect(result).toEqual([
        {
          documentId: 1,
          decisionId: 42,
          uploadedBy: 3,
          fileName: "policy.pdf",
          uploadDate: "2026-07-01",
          createdAt: "2026-07-01T00:00:00Z",
          status: "processed",
          statusMessage: undefined,
        },
      ]);
    });

    it("converts null upload_date and status_message to undefined", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            document_id: 2,
            file_name: "notes.pdf",
            uploaded_by: 1,
            upload_date: null,
            created_at: "2026-07-01T00:00:00Z",
            status: "pending",
            status_message: null,
          },
        ],
      });

      const result = await fetchDocumentsForDecision(1);

      expect(result[0].uploadDate).toBeUndefined();
      expect(result[0].statusMessage).toBeUndefined();
    });
  });

  describe("uploadDocumentToDecision", () => {
    it("sends a FormData body with multipart content-type and maps full response", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          document_id: 5,
          decision_id: 42,
          file_name: "report.pdf",
          file_path: "/uploads/report.pdf",
          uploaded_by: 2,
          upload_date: "2026-07-01",
          created_at: "2026-07-01T00:00:00Z",
          status: "processed",
          status_message: null,
        },
      });

      const file = new File(["content"], "report.pdf", { type: "application/pdf" });
      const result = await uploadDocumentToDecision(42, file);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/decisions/42/documents",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      expect(result).toEqual({
        documentId: 5,
        decisionId: 42,
        uploadedBy: 2,
        fileName: "report.pdf",
        filePath: "/uploads/report.pdf",
        uploadDate: "2026-07-01",
        createdAt: "2026-07-01T00:00:00Z",
        status: "processed",
        statusMessage: undefined,
      });
    });
  });

  describe("deleteDocument", () => {
    it("calls delete with the correct document endpoint", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await deleteDocument(9);

      expect(apiClient.delete).toHaveBeenCalledWith("/documents/9");
    });
  });

  describe("getDocumentDownloadUrl", () => {
    it("returns the url from the response", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { url: "https://example.com/file.pdf" },
      });

      const result = await getDocumentDownloadUrl(9);

      expect(apiClient.get).toHaveBeenCalledWith("/documents/9/download-url");
      expect(result).toBe("https://example.com/file.pdf");
    });
  });

  describe("fetchAllDocuments", () => {
    it("maps all documents including decisionId from each row", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            document_id: 1,
            file_name: "a.pdf",
            uploaded_by: 1,
            upload_date: "2026-07-01",
            created_at: "2026-07-01T00:00:00Z",
            decision_id: 10,
            status: "processed",
            status_message: null,
          },
          {
            document_id: 2,
            file_name: "b.pdf",
            uploaded_by: 2,
            upload_date: null,
            created_at: "2026-07-02T00:00:00Z",
            decision_id: 20,
            status: "pending",
            status_message: "Queued",
          },
        ],
      });

      const result = await fetchAllDocuments();

      expect(apiClient.get).toHaveBeenCalledWith("/documents");
      expect(result).toEqual([
        {
          documentId: 1,
          decisionId: 10,
          uploadedBy: 1,
          fileName: "a.pdf",
          uploadDate: "2026-07-01",
          createdAt: "2026-07-01T00:00:00Z",
          status: "processed",
          statusMessage: undefined,
        },
        {
          documentId: 2,
          decisionId: 20,
          uploadedBy: 2,
          fileName: "b.pdf",
          uploadDate: undefined,
          createdAt: "2026-07-02T00:00:00Z",
          status: "pending",
          statusMessage: "Queued",
        },
      ]);
    });
  });
});