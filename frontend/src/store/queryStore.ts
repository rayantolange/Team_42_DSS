import { create } from "zustand";
import type { QueryResult, QuerySource, ConfidenceLevel } from "@/types/api";

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

interface QueryState {
  currentQueryText: string;
  currentResult: QueryResult | null;
  queryHistory: QueryResult[];
  mode: QueryMode;
  messages: ChatMessage[];
}

interface QueryActions {
  setCurrentQueryText: (text: string) => void;
  setCurrentResult: (result: QueryResult) => void;
  clearCurrentResult: () => void;
  addToHistory: (result: QueryResult) => void;
  clearHistory: () => void;
  setMode: (mode: QueryMode) => void;
  addMessage: (message: ChatMessage) => void;
  clearThread: () => void;
}

const MAX_HISTORY = 50;

function makeMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useQueryStore = create<QueryState & QueryActions>((set) => ({
  currentQueryText: "",
  currentResult: null,
  queryHistory: [],
  mode: "search",
  messages: [],

  setCurrentQueryText: (text) => set({ currentQueryText: text }),
  setCurrentResult: (result) => set({ currentResult: result }),
  clearCurrentResult: () => set({ currentResult: null }),
  addToHistory: (result) =>
    set((state) => ({
      queryHistory: [result, ...state.queryHistory].slice(0, MAX_HISTORY),
    })),
  clearHistory: () => set({ queryHistory: [] }),

  setMode: (mode) => set({ mode }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearThread: () => set({ messages: [] }),
}));

export { makeMessageId };
