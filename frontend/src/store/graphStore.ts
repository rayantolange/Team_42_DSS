import { create } from "zustand";
import type { GraphEntityType } from "@features/graph/useGraphData";

export interface GraphViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface GraphFilters {
  entityTypes: GraphEntityType[];
  searchTerm: string;
}

interface GraphState {
  selectedNodeId: string | null;
  viewport: GraphViewport;
  filters: GraphFilters;
}

interface GraphActions {
  setSelectedNodeId: (nodeId: string | null) => void;
  setViewport: (viewport: GraphViewport) => void;
  setFilters: (filters: Partial<GraphFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: GraphFilters = {
  entityTypes: ["decision", "strategy", "constraint", "outcome"],
  searchTerm: "",
};

const defaultViewport: GraphViewport = { x: 0, y: 0, zoom: 1 };

export const useGraphStore = create<GraphState & GraphActions>((set, get) => ({
  selectedNodeId: null,
  viewport: defaultViewport,
  filters: defaultFilters,
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  setViewport: (viewport) => set({ viewport }),
  setFilters: (filters) =>
    set({ filters: { ...get().filters, ...filters } }),
  resetFilters: () => set({ filters: defaultFilters }),
}));