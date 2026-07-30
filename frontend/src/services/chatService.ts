import { apiClient } from "./apiClient";
import type { ConfidenceLevel, QuerySource } from "@/types/api";
import type { ChatMessage } from "@store/queryStore";

export type ChatMode = "chat" | "rag_search";

interface BackendChatThreadResponse {
  thread_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendSourceCitation {
  source_type:
    | "decision"
    | "strategy"
    | "constraint"
    | "outcome"
    | "document_chunk";
  reference_id: number;
  snippet: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

interface BackendChatMessageResponse {
  message_id: number;
  thread_id: number;
  role: "user" | "assistant";
  mode: ChatMode;
  content: string;
  created_at: string;
  citations: BackendSourceCitation[];
  confidence_score: number | null;
  confidence_level: ConfidenceLevel | null;
}

export interface SendMessageResult {
  answer: string;
  sources: QuerySource[];
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
}

export async function createThread(title?: string): Promise<number> {
  const { data } = await apiClient.post<BackendChatThreadResponse>(
    "/chat/threads",
    { title },
  );
  return data.thread_id;
}

/**
 * Turns one backend citation into the shape the UI already knows how to
 * render. Two honest simplifications, both display-only (not decision-
 * critical like the confidence score is):
 *  - relevanceScore is derived from citation rank/order, not a real score
 *    — the backend's real per-source rerank score isn't sent to the API
 *    or persisted, so this is an approximation for the "% match" badge.
 *  - graphNodeId is skipped for document_chunk citations since chunks
 *    aren't nodes in the Knowledge Graph.
 */
function citationToSource(
  citation: BackendSourceCitation,
  index: number,
): QuerySource {
  const meta = citation.metadata;
  let title: string;

  switch (citation.source_type) {
    case "decision":
      title = meta.title ?? `Decision #${citation.reference_id}`;
      break;
    case "strategy":
      title = meta.strategy_name ?? `Strategy #${citation.reference_id}`;
      break;
    case "constraint":
      title = meta.constraint_type ?? `Constraint #${citation.reference_id}`;
      break;
    case "outcome":
      title = meta.decision_title
        ? `Outcome — ${meta.decision_title}`
        : `Outcome #${citation.reference_id}`;
      break;
    case "document_chunk":
      title = meta.file_name
        ? `${meta.file_name} (p. ${meta.page_number})`
        : `Document #${meta.document_id}, p. ${meta.page_number}`;
      break;
    default:
      title = `Source #${citation.reference_id}`;
  }

  return {
    id: `${citation.source_type}-${citation.reference_id}-${index}`,
    title,
    snippet: citation.snippet,
    documentId:
      citation.source_type === "document_chunk"
        ? String(meta.document_id)
        : undefined,
    decisionId:
      citation.source_type === "decision"
        ? String(citation.reference_id)
        : undefined,
    graphNodeId:
      citation.source_type === "document_chunk"
        ? undefined
        : `${citation.source_type}-${citation.reference_id}`,
    relevanceScore: Math.max(0.3, 1 - index * 0.15),
  };
}

export async function sendMessage(
  threadId: number,
  content: string,
  mode: ChatMode,
): Promise<SendMessageResult> {
  const { data } = await apiClient.post<BackendChatMessageResponse>(
    `/chat/threads/${threadId}/messages`,
    { content, mode },
  );
  return {
    answer: data.content,
    sources: data.citations.map(citationToSource),
    confidenceScore: data.confidence_score ?? undefined,
    confidenceLevel: data.confidence_level ?? undefined,
  };
}

export interface ThreadSummary {
  threadId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function listThreads(): Promise<ThreadSummary[]> {
  const { data } = await apiClient.get<BackendChatThreadResponse[]>("/chat/threads");
  return data.map((t) => ({
    threadId: t.thread_id,
    title: t.title ?? "New chat",
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

function toChatMessage(m: BackendChatMessageResponse): ChatMessage {
  const isRagAnswer = m.mode === "rag_search" && m.role === "assistant";
  return {
    id: `msg-${m.message_id}`,
    role: m.role,
    text: m.content,
    createdAt: m.created_at,
    sources: isRagAnswer ? m.citations.map(citationToSource) : undefined,
    confidenceScore: m.confidence_score ?? undefined,
    confidenceLevel: m.confidence_level ?? undefined,
  };
}

export async function getThreadMessages(threadId: number): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<BackendChatMessageResponse[]>(
    `/chat/threads/${threadId}/messages`,
  );
  return data.map(toChatMessage);
}

export async function deleteThreadRemote(threadId: number): Promise<void> {
  await apiClient.delete(`/chat/threads/${threadId}`);
}
