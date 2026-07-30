import { Link } from "react-router-dom";
import { FileText, Clock, FileCheck, TrendingUp as TrendingUpIcon, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { useDashboardMetrics } from "@features/dashboard/useDashboardData";
import { StatCards, type StatCardDef } from "@features/dashboard/StatCards";
import {
  OutcomePieChart,
  DepartmentComparisonChart,
  TrendChart,
} from "@features/dashboard/ChartPanel";
import { RecentDecisionsList } from "@features/dashboard/RecentDecisionsList";
import { DashboardSidePanel } from "@features/dashboard/DashboardSidePanel";
import { Skeleton } from "@components/ui/Skeleton";

export default function DashboardPage() {
  const { canSeeAllDepartments } = useAuth();
  const metricsQuery = useDashboardMetrics();
  const metrics = metricsQuery.data;

  const stats: StatCardDef[] | null = metrics
    ? [
        {
          label: "Total Decisions",
          value: metrics.totalDecisions.toLocaleString(),
          numericValue: metrics.totalDecisions,
          icon: FileText,
          tint: "bg-blue-100 text-blue-700",
          accent: "#2563eb",
        },
        {
          label: "Pending Decisions",
          value: metrics.pendingDecisions.toLocaleString(),
          numericValue: metrics.pendingDecisions,
          icon: Clock,
          tint: "bg-violet-100 text-violet-700",
          accent: "#7c3aed",
        },
        {
          label: "Documents Indexed",
          value: metrics.documentsIndexed.toLocaleString(),
          numericValue: metrics.documentsIndexed,
          icon: FileCheck,
          tint: "bg-amber-100 text-amber-700",
          accent: "#d97706",
        },
        {
          label: "Positive Outcome Rate",
          value: `${metrics.positiveOutcomeRate.toFixed(0)}%`,
          numericValue: Math.round(metrics.positiveOutcomeRate),
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
              {canSeeAllDepartments
                ? "Overview of institutional decisions, departments, and outcomes"
                : "Overview of your department's decisions and outcomes"}
            </p>
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

      {metricsQuery.isLoading || !metrics ? (
        <DashboardContentSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-6">
            <div
              className="grid grid-cols-1 gap-6 animate-fade-in-up lg:grid-cols-2"
              style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
            >
              <OutcomePieChart data={metrics.outcomeBreakdown} />
              <TrendChart data={metrics.decisionTrends} />
            </div>
            {canSeeAllDepartments && (
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
              outcomeCoveragePercent={metrics.outcomeCoveragePercent}
            />
          </div>
        </div>
      )}

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