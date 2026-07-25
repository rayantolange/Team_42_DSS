import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Network,
  TrendingUp as TrendingUpIcon,
  FileCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { useDashboardStore } from "@store/dashboardStore";
import { useDashboardMetrics, useDashboardTrends } from "@features/dashboard/useDashboardData";
import { useDocuments } from "@features/upload/useDocuments";
import { StatCards, type StatCardDef } from "@features/dashboard/StatCards";
import { DepartmentFilter } from "@features/dashboard/DepartmentFilter";
import {
  OutcomePieChart,
  DepartmentComparisonChart,
  TrendChart,
} from "@features/dashboard/ChartPanel";
import { RecentDecisionsList } from "@features/dashboard/RecentDecisionsList";
import { DashboardSidePanel } from "@features/dashboard/DashboardSidePanel";
import { Skeleton } from "@components/ui/Skeleton";

const CAPACITY_BYTES = 1024 ** 4; // 1 TB, consistent with the Documents page

export default function DashboardPage() {
  const { isAdmin, scopedDepartmentId } = useAuth();
  const selectedDepartment = useDashboardStore((s) => s.selectedDepartment);
  const setSelectedDepartment = useDashboardStore((s) => s.setSelectedDepartment);

  // Department heads are locked to their own department regardless
  // of any stale filter state from a previous admin session.
  const effectiveDepartmentId = isAdmin ? selectedDepartment : scopedDepartmentId;

  useEffect(() => {
    if (!isAdmin && scopedDepartmentId) {
      setSelectedDepartment(scopedDepartmentId);
    }
  }, [isAdmin, scopedDepartmentId, setSelectedDepartment]);

  const metricsQuery = useDashboardMetrics(effectiveDepartmentId);
  const trendsQuery = useDashboardTrends(effectiveDepartmentId);
  const documentsQuery = useDocuments();

  const metrics = metricsQuery.data;

  const positiveRate =
    metrics && metrics.totalDecisions > 0
      ? ((metrics.outcomeBreakdown.find((o) => o.sentiment === "positive")?.count ?? 0) /
          metrics.totalDecisions) *
        100
      : 0;

  // Month-over-month change in decision volume, computed from the real
  // trend series (no fabricated telemetry).
  let decisionTrend: StatCardDef["trend"];
  if (trendsQuery.data && trendsQuery.data.length >= 2) {
    const points = trendsQuery.data;
    const last = points[points.length - 1]!;
    const prev = points[points.length - 2]!;
    const lastTotal = last.approved + last.rejected + last.deferred;
    const prevTotal = prev.approved + prev.rejected + prev.deferred;
    if (prevTotal > 0) {
      const pctChange = Math.round(((lastTotal - prevTotal) / prevTotal) * 100);
      decisionTrend = {
        direction: pctChange >= 0 ? "up" : "down",
        label: `${pctChange >= 0 ? "+" : ""}${pctChange}% vs last month`,
        isGood: pctChange >= 0,
      };
    }
  }

  const documents = documentsQuery.data ?? [];
  const usedBytes = documents.reduce((sum, doc) => sum + doc.fileSizeBytes, 0);
  const storagePercentUsed = Math.min(100, Math.round((usedBytes / CAPACITY_BYTES) * 100));

  const stats: StatCardDef[] | null = metrics
    ? [
        {
          label: "Total Decisions",
          value: metrics.totalDecisions.toLocaleString(),
          numericValue: metrics.totalDecisions,
          icon: FileText,
          tint: "bg-blue-100 text-blue-700",
          accent: "#2563eb",
          trend: decisionTrend,
        },
        {
          label: "Active Policies",
          value: metrics.totalPolicies.toLocaleString(),
          numericValue: metrics.totalPolicies,
          icon: Network,
          tint: "bg-violet-100 text-violet-700",
          accent: "#7c3aed",
        },
        {
          label: "Documents Indexed",
          value: documents.length.toLocaleString(),
          numericValue: documents.length,
          icon: FileCheck,
          tint: "bg-amber-100 text-amber-700",
          accent: "#d97706",
          live: !documentsQuery.isLoading,
        },
        {
          label: "Positive Outcome Rate",
          value: `${positiveRate.toFixed(0)}%`,
          numericValue: Math.round(positiveRate),
          suffix: "%",
          icon: TrendingUpIcon,
          tint: "bg-emerald-100 text-emerald-700",
          accent: "#059669",
        },
      ]
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/60 via-background to-violet/[0.04] p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-violet/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Executive Overview</h1>
            <p className="text-muted-foreground">
              Overview of institutional decisions, departments, and outcomes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <DepartmentFilter value={selectedDepartment} onChange={setSelectedDepartment} />
            )}
            <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:inline-flex">
              Last 24 Hours
            </span>
          </div>
        </div>

        <div className="relative mt-6">
          {metricsQuery.isLoading || !stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <StatCards stats={stats} />
          )}
        </div>
      </div>

      {metricsQuery.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Unable to load dashboard metrics. Please try refreshing the page.</span>
        </div>
      )}

      {metricsQuery.isLoading || !stats || !metrics ? (
        <DashboardContentSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex flex-col gap-6">
              <div
                className="grid grid-cols-1 gap-6 animate-fade-in-up lg:grid-cols-2"
                style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
              >
                <OutcomePieChart data={metrics.outcomeBreakdown} />
                {trendsQuery.data && <TrendChart data={trendsQuery.data} />}
              </div>

              {isAdmin && (
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "140ms", animationFillMode: "backwards" }}
                >
                  <DepartmentComparisonChart data={metrics.departmentComparison} />
                </div>
              )}

              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
              >
                <RecentDecisionsList decisions={metrics.recentDecisions} />
              </div>
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
            >
              <DashboardSidePanel
                departmentComparison={metrics.departmentComparison}
                storagePercentUsed={storagePercentUsed}
              />
            </div>
          </div>
        </>
      )}

      {/* Floating quick-access action, always reachable while scrolling the dashboard */}
      <Link
        to="/query"
        aria-label="Ask Nirnaya a question"
        title="Ask Nirnaya"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-popover transition-transform duration-200 hover:scale-105 hover:shadow-glow active:scale-95"
      >
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </Link>
    </div>
  );
}

function DashboardContentSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" role="status" aria-busy="true">
      <span className="sr-only">Loading dashboard…</span>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
