import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  createThread,
  sendMessage,
  listThreads,
  getThreadMessages,
  deleteThreadRemote,
} from "./chatService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("chatService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createThread", () => {
    it("sends title and returns thread_id", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          thread_id: 55,
          title: "New Thread",
          created_at: "2026-07-01T00:00:00Z",
          updated_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await createThread("New Thread");

      expect(apiClient.post).toHaveBeenCalledWith("/chat/threads", {
        title: "New Thread",
      });
      expect(result).toBe(55);
    });
  });

  describe("sendMessage", () => {
    it("sends content and mode, maps content/citations/confidence", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          message_id: 1,
          thread_id: 10,
          role: "assistant",
          mode: "rag_search",
          content: "Here is the answer",
          created_at: "2026-07-01T00:00:00Z",
          citations: [],
          confidence_score: 0.9,
          confidence_level: "high",
        },
      });

      const result = await sendMessage(10, "What happened?", "rag_search");

      expect(apiClient.post).toHaveBeenCalledWith(
        "/chat/threads/10/messages",
        { content: "What happened?", mode: "rag_search" },
        { timeout: 0 }
      );
      expect(result.answer).toBe("Here is the answer");
      expect(result.confidenceScore).toBe(0.9);
      expect(result.confidenceLevel).toBe("high");
    });

    it("converts null confidence_score/level to undefined", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          message_id: 2,
          thread_id: 10,
          role: "assistant",
          mode: "chat",
          content: "Hi",
          created_at: "2026-07-01T00:00:00Z",
          citations: [],
          confidence_score: null,
          confidence_level: null,
        },
      });

      const result = await sendMessage(10, "Hi", "chat");

      expect(result.confidenceScore).toBeUndefined();
      expect(result.confidenceLevel).toBeUndefined();
    });

    it("maps a decision citation using metadata.title", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          message_id: 3,
          thread_id: 10,
          role: "assistant",
          mode: "rag_search",
          content: "Answer",
          created_at: "2026-07-01T00:00:00Z",
          citations: [
            {
              source_type: "decision",
              reference_id: 42,
              snippet: "Some snippet",
              metadata: { title: "Switch WiFi Provider" },
            },
          ],
          confidence_score: null,
          confidence_level: null,
        },
      });

      const result = await sendMessage(10, "Q", "rag_search");

      expect(result.sources[0]).toMatchObject({
        title: "Switch WiFi Provider",
        decisionId: "42",
        graphNodeId: "decision-42",
      });
    });

    it("falls back to default title for decision citation with no metadata.title", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          message_id: 4,
          thread_id: 10,
          role: "assistant",
          mode: "rag_search",
          content: "Answer",
          created_at: "2026-07-01T00:00:00Z",
          citations: [
            {
              source_type: "decision",
              reference_id: 7,
              snippet: "Snippet",
              metadata: {},
            },
          ],
          confidence_score: null,
          confidence_level: null,
        },
      });

      const result = await sendMessage(10, "Q", "rag_search");

      expect(result.sources[0].title).toBe("Decision #7");
    });

    it("maps a document_chunk citation with documentId and no graphNodeId", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          message_id: 5,
          thread_id: 10,
          role: "assistant",
          mode: "rag_search",
          content: "Answer",
          created_at: "2026-07-01T00:00:00Z",
          citations: [
            {
              source_type: "document_chunk",
              reference_id: 99,
              snippet: "Chunk text",
              metadata: { file_name: "policy.pdf", page_number: 3, document_id: 12 },
            },
          ],
          confidence_score: null,
          confidence_level: null,
        },
      });

      const result = await sendMessage(10, "Q", "rag_search");

      expect(result.sources[0]).toMatchObject({
        title: "policy.pdf (p. 3)",
        documentId: "12",
        graphNodeId: undefined,
        decisionId: undefined,
      });
    });

    it("computes decreasing relevanceScore by citation index, floored at 0.3", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          message_id: 6,
          thread_id: 10,
          role: "assistant",
          mode: "rag_search",
          content: "Answer",
          created_at: "2026-07-01T00:00:00Z",
          citations: Array.from({ length: 10 }, (_, i) => ({
            source_type: "strategy" as const,
            reference_id: i,
            snippet: "s",
            metadata: {},
          })),
          confidence_score: null,
          confidence_level: null,
        },
      });

      const result = await sendMessage(10, "Q", "rag_search");

      expect(result.sources[0].relevanceScore).toBeCloseTo(1);
      expect(result.sources[9].relevanceScore).toBeCloseTo(0.3);
    });
  });

  describe("listThreads", () => {
    it("maps thread fields and defaults null title to 'New chat'", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            thread_id: 1,
            title: null,
            created_at: "2026-07-01T00:00:00Z",
            updated_at: "2026-07-02T00:00:00Z",
          },
        ],
      });

      const result = await listThreads();

      expect(apiClient.get).toHaveBeenCalledWith("/chat/threads");
      expect(result).toEqual([
        {
          threadId: 1,
          title: "New chat",
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-02T00:00:00Z",
        },
      ]);
    });
  });

  describe("getThreadMessages", () => {
    it("includes sources only for rag_search assistant messages", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            message_id: 1,
            thread_id: 10,
            role: "user",
            mode: "rag_search",
            content: "What happened?",
            created_at: "2026-07-01T00:00:00Z",
            citations: [
              {
                source_type: "decision",
                reference_id: 1,
                snippet: "s",
                metadata: {},
              },
            ],
            confidence_score: null,
            confidence_level: null,
          },
          {
            message_id: 2,
            thread_id: 10,
            role: "assistant",
            mode: "rag_search",
            content: "Here's the answer",
            created_at: "2026-07-01T00:00:01Z",
            citations: [
              {
                source_type: "decision",
                reference_id: 1,
                snippet: "s",
                metadata: {},
              },
            ],
            confidence_score: 0.8,
            confidence_level: "high",
          },
        ],
      });

      const result = await getThreadMessages(10);

      expect(apiClient.get).toHaveBeenCalledWith("/chat/threads/10/messages");
      expect(result[0].sources).toBeUndefined();
      expect(result[1].sources).toHaveLength(1);
      expect(result[1].id).toBe("msg-2");
    });

    it("does not attach sources for plain chat mode assistant messages", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            message_id: 3,
            thread_id: 10,
            role: "assistant",
            mode: "chat",
            content: "Just chatting",
            created_at: "2026-07-01T00:00:00Z",
            citations: [],
            confidence_score: null,
            confidence_level: null,
          },
        ],
      });

      const result = await getThreadMessages(10);

      expect(result[0].sources).toBeUndefined();
    });
  });

  describe("deleteThreadRemote", () => {
    it("calls delete with the correct thread endpoint", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await deleteThreadRemote(10);

      expect(apiClient.delete).toHaveBeenCalledWith("/chat/threads/10");
    });
  });
});