import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized query key factory. Using a factory (rather than ad hoc
 * arrays scattered across components) keeps keys consistent so
 * invalidation actually hits the right cache entries.
 */
export const queryKeys = {
  dashboard: {
    metrics: (departmentId: string | null) =>
      ["dashboard", "metrics", departmentId] as const,
    trends: (departmentId: string | null) =>
      ["dashboard", "trends", departmentId] as const,
  },
  decisions: {
    list: (filters: object) => ["decisions", "list", filters] as const,
    detail: (id: string) => ["decisions", "detail", id] as const,
  },
  query: {
    submit: (text: string) => ["query", "submit", text] as const,
  },
  graph: {
    data: (departmentId: string | null) =>
      ["graph", "data", departmentId] as const,
  },
  departments: {
    list: () => ["departments", "list"] as const,
  },
  documents: {
    list: () => ["documents", "list"] as const,
  },
};

/**
 * staleTime reference (per spec):
 * - Dashboard metrics: 5 minutes
 * - Decision details:   1 hour
 * - Query results:      0 (always refetch)
 *
 * Query results are implemented as a mutation (see
 * features/query/useSubmitQuery.ts), not a cached query, since each
 * submission is a one-off user action rather than idempotent data
 * keyed by stable params — so staleTime/gcTime don't apply to it the
 * way they do to the resources below.
 */
export const STALE_TIME = {
  dashboardMetrics: 5 * 60 * 1000,
  decisionDetail: 60 * 60 * 1000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // sane default for anything not explicitly set
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
