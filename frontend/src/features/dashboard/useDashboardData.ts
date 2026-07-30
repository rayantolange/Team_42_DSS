import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@services/dashboardService";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: fetchDashboardMetrics,
  });
}