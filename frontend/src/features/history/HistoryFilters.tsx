import { Search } from "lucide-react";
import { DEPARTMENTS } from "@services/index";
import type { DecisionStatus } from "@/types/domain";

const STATUS_OPTIONS: { value: DecisionStatus; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "implemented", label: "Implemented" },
  { value: "rejected", label: "Rejected" },
  { value: "deferred", label: "Deferred" },
  { value: "conditional", label: "Conditional" },
  { value: "under_review", label: "Under Review" },
];

export interface HistoryFilterValues {
  departmentId: string | null;
  status: DecisionStatus[];
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
}

interface HistoryFiltersProps {
  values: HistoryFilterValues;
  onChange: (values: HistoryFilterValues) => void;
  isAdmin: boolean;
}

export function HistoryFilters({ values, onChange, isAdmin }: HistoryFiltersProps) {
  function update(partial: Partial<HistoryFilterValues>) {
    onChange({ ...values, ...partial });
  }

  function toggleStatus(status: DecisionStatus) {
    const next = values.status.includes(status)
      ? values.status.filter((s) => s !== status)
      : [...values.status, status];
    update({ status: next });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="history-search" className="text-sm font-medium">
            Search
          </label>
          <div className="relative mt-1.5">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="history-search"
              type="text"
              value={values.searchTerm}
              onChange={(e) => update({ searchTerm: e.target.value })}
              placeholder="Search decisions…"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {isAdmin && (
          <div>
            <label htmlFor="history-department" className="text-sm font-medium">
              Department
            </label>
            <select
              id="history-department"
              value={values.departmentId ?? "all"}
              onChange={(e) =>
                update({ departmentId: e.target.value === "all" ? null : e.target.value })
              }
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="history-date-from" className="text-sm font-medium">
            From
          </label>
          <input
            id="history-date-from"
            type="date"
            value={values.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="history-date-to" className="text-sm font-medium">
            To
          </label>
          <input
            id="history-date-to"
            type="date"
            value={values.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Status</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by decision status">
          {STATUS_OPTIONS.map((opt) => {
            const active = values.status.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStatus(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
