import { create } from "zustand";

export interface DashboardFilters {
  dateRangeStart?: string;
  dateRangeEnd?: string;
  status?: string[];
}

interface DashboardState {
  selectedDepartment: string | null; // null = all departments (admin only)
  selectedFilters: DashboardFilters;
}

interface DashboardActions {
  setSelectedDepartment: (departmentId: string | null) => void;
  setSelectedFilters: (filters: DashboardFilters) => void;
  resetFilters: () => void;
}

const initialFilters: DashboardFilters = {};

export const useDashboardStore = create<DashboardState & DashboardActions>(
  (set) => ({
    selectedDepartment: null,
    selectedFilters: initialFilters,

    setSelectedDepartment: (departmentId) =>
      set({ selectedDepartment: departmentId }),

    setSelectedFilters: (filters) => set({ selectedFilters: filters }),

    resetFilters: () => set({ selectedFilters: initialFilters }),
  })
);
