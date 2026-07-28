import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, AlertCircle, Search, ChevronDown } from "lucide-react";
import { useDecisions } from "@features/decisions/useDecisions";
import { Skeleton } from "@components/ui/Skeleton";
import type { DecisionRecordStatus } from "@/types/domain";

const STATUS_OPTIONS: { label: string; value: DecisionRecordStatus | "all" }[] =
  [
    { label: "All Statuses", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Approved", value: "approved" },
    { label: "Implemented", value: "implemented" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

const STATUS_STYLES: Record<DecisionRecordStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-100 text-blue-700",
  implemented: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function DecisionsListPage() {
  const [statusFilter, setStatusFilter] = useState<
    DecisionRecordStatus | "all"
  >("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError } = useDecisions({
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
  });

  const decisionTypes = useMemo(() => {
    const types = new Set<string>();
    (data ?? []).forEach((d) => {
      if (d.decisionType) types.add(d.decisionType);
    });
    return Array.from(types).sort();
  }, [data]);

  const decisions = (data ?? [])
    .filter((d) =>
      typeFilter === "all" ? true : d.decisionType === typeFilter,
    )
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    .filter((d) => {
      if (!dateFrom && !dateTo) return true;
      if (!d.decisionDate) return false;
      const date = new Date(d.decisionDate).getTime();
      if (dateFrom && date < new Date(dateFrom).getTime()) return false;
      if (dateTo && date > new Date(dateTo).getTime()) return false;
      return true;
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/60 via-background to-violet/[0.04] p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Decisions</h1>
            <p className="text-muted-foreground">
              Manage institutional decisions, strategies, constraints, and
              outcomes
            </p>
          </div>
          <Link
            to="/decisions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-glow active:scale-95"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Decision
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-sm font-medium" htmlFor="filter-search">
              Search
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="filter-search"
                type="text"
                placeholder="Search decisions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="filter-status">
              Status
            </label>
            <div className="relative mt-1.5">
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as DecisionRecordStatus | "all",
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="filter-type">
              Decision Type
            </label>
            <div className="relative mt-1.5">
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Types</option>
                {decisionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="filter-date-from">
              From
            </label>
            <input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="filter-date-to">
              To
            </label>
            <input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Unable to load decisions. Please try refreshing the page.</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <FileText
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No decisions found. Create your first one to get started.
          </p>
          <Link
            to="/decisions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Decision
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {decisions.map((decision, i) => (
            <Link
              key={decision.decisionId}
              to={`/decisions/${decision.decisionId}`}
              className="animate-fade-in-up flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
              style={{
                animationDelay: `${i * 20}ms`,
                animationFillMode: "backwards",
              }}
            >
              <h3 className="min-w-0 flex-1 truncate font-medium">
                {decision.title}
              </h3>

              <span className="hidden w-32 shrink-0 truncate text-xs text-muted-foreground sm:block">
                {decision.decisionType ?? "—"}
              </span>

              <span
                className={`w-28 shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-medium ${STATUS_STYLES[decision.status]}`}
              >
                {decision.status}
              </span>

              <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground md:block">
                {decision.decisionDate
                  ? new Date(decision.decisionDate).toLocaleDateString()
                  : "—"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
