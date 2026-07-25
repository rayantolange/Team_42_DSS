import { create } from "zustand";
import type { QueryResult } from "@/types/api";

interface QueryState {
  currentQueryText: string;
  currentResult: QueryResult | null;
  queryHistory: QueryResult[];
}

interface QueryActions {
  setCurrentQueryText: (text: string) => void;
  setCurrentResult: (result: QueryResult) => void;
  clearCurrentResult: () => void;
  addToHistory: (result: QueryResult) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useQueryStore = create<QueryState & QueryActions>((set) => ({
  currentQueryText: "",
  currentResult: null,
  queryHistory: [],

  setCurrentQueryText: (text) => set({ currentQueryText: text }),

  setCurrentResult: (result) => set({ currentResult: result }),

  clearCurrentResult: () => set({ currentResult: null }),

  addToHistory: (result) =>
    set((state) => ({
      queryHistory: [result, ...state.queryHistory].slice(0, MAX_HISTORY),
    })),

  clearHistory: () => set({ queryHistory: [] }),
}));
