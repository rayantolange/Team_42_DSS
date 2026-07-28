import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, AlertCircle, Search } from "lucide-react";
import { useDecisions } from "@features/decisions/useDecisions";
import { Skeleton } from "@components/ui/Skeleton";
import type { DecisionRecordStatus } from "@/types/domain";

const STATUS_FILTERS: { label: string; value: DecisionRecordStatus | "all" }[] = [
  { label: "All", value: "all" },
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
  const [statusFilter, setStatusFilter] = useState<DecisionRecordStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useDecisions({
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
  });

  const decisions = (data ?? []).filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

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
              Manage institutional decisions, strategies, constraints, and outcomes
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search decisions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decisions.map((decision, i) => (
            <Link
              key={decision.decisionId}
              to={`/decisions/${decision.decisionId}`}
              className="animate-fade-in-up rounded-xl border border-border bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug">{decision.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[decision.status]}`}
                >
                  {decision.status}
                </span>
              </div>
              {decision.decisionType && (
                <p className="mt-2 text-xs text-muted-foreground">{decision.decisionType}</p>
              )}
              {decision.decisionDate && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(decision.decisionDate).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}