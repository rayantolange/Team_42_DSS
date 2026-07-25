import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics, fetchDashboardTrends } from "@services/index";
import { queryKeys, STALE_TIME } from "@app/queryClient";

export function useDashboardMetrics(departmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(departmentId),
    queryFn: () => fetchDashboardMetrics(departmentId),
    staleTime: STALE_TIME.dashboardMetrics,
  });
}

export function useDashboardTrends(departmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard.trends(departmentId),
    queryFn: () => fetchDashboardTrends(departmentId),
    staleTime: STALE_TIME.dashboardMetrics,
  });
}
