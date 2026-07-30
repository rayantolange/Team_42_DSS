import { create } from "zustand";
import type { QuerySource, ConfidenceLevel } from "@/types/api";

export type QueryMode = "search" | "chat";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  /** Only present on assistant messages that came from a fresh search. */
  sources?: QuerySource[];
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface QueryState {
  currentQueryText: string;
  mode: QueryMode;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  threadIdsByConversationId: Record<string, number>;
}

interface QueryActions {
  setCurrentQueryText: (text: string) => void;
  setMode: (mode: QueryMode) => void;
  /** Deselects the active conversation so the next message starts a fresh one. */
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  /** Appends a message to the active conversation, creating one first if none is active. */
  addMessageToActive: (message: ChatMessage) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  ensureActiveConversation: () => string; // NEW
  setThreadId: (conversationId: string, threadId: number) => void; // NEW
  getThreadId: (conversationId: string) => number | undefined;
}

const MAX_CONVERSATIONS = 50;

function makeMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeConversationId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromText(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

export const useQueryStore = create<QueryState & QueryActions>((set, get) => ({
  currentQueryText: "",
  mode: "search",
  conversations: [],
  activeConversationId: null,
  threadIdsByConversationId: {},

  setCurrentQueryText: (text) => set({ currentQueryText: text }),
  setMode: (mode) => set({ mode }),

  startNewConversation: () => set({ activeConversationId: null }),

  selectConversation: (id) => set({ activeConversationId: id }),

  ensureActiveConversation: () => {
    const { activeConversationId, conversations } = get();
    if (activeConversationId) return activeConversationId;
    const now = new Date().toISOString();
    const newConversation: ChatConversation = {
      id: makeConversationId(),
      title: "New chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    set({
      conversations: [newConversation, ...conversations].slice(
        0,
        MAX_CONVERSATIONS,
      ),
      activeConversationId: newConversation.id,
    });
    return newConversation.id;
  },

  addMessageToActive: (message) =>
    set((state) => {
      const now = new Date().toISOString();
      const { conversations, activeConversationId } = state;

      // No active conversation yet — create one, seeded with this message,
      // and title it from the first user message.
      if (!activeConversationId) {
        const newConversation: ChatConversation = {
          id: makeConversationId(),
          title:
            message.role === "user" ? titleFromText(message.text) : "New chat",
          messages: [message],
          createdAt: now,
          updatedAt: now,
        };
        return {
          conversations: [newConversation, ...conversations].slice(
            0,
            MAX_CONVERSATIONS,
          ),
          activeConversationId: newConversation.id,
        };
      }

      const updated = conversations.map((c) => {
        if (c.id !== activeConversationId) return c;
        const isFirstMessage = c.messages.length === 0; // NEW — retitle an empty conv seeded via ensureActiveConversation
        return {
          ...c,
          title:
            isFirstMessage && message.role === "user"
              ? titleFromText(message.text)
              : c.title,
          messages: [...c.messages, message],
          updatedAt: now,
        };
      });
      return { conversations: updated };
    }),

  deleteConversation: (id) =>
    set((state) => {
      const restThreadIds = { ...state.threadIdsByConversationId };
      delete restThreadIds[id]; // NEW cleanup
      return {
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId:
          state.activeConversationId === id ? null : state.activeConversationId,
        threadIdsByConversationId: restThreadIds,
      };
    }),

  clearAllConversations: () =>
    set({
      conversations: [],
      activeConversationId: null,
      threadIdsByConversationId: {},
    }),

  // NEW
  setThreadId: (conversationId, threadId) =>
    set((state) => ({
      threadIdsByConversationId: {
        ...state.threadIdsByConversationId,
        [conversationId]: threadId,
      },
    })),

  // NEW
  getThreadId: (conversationId) =>
    get().threadIdsByConversationId[conversationId],
}));

export { makeMessageId };
