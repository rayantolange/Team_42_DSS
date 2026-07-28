import { Search } from "lucide-react";
import type { DecisionRecordStatus } from "@/types/domain";

const STATUS_OPTIONS: { value: DecisionRecordStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "implemented", label: "Implemented" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export interface HistoryFilterValues {
  status: DecisionRecordStatus | "all";
  searchTerm: string;
}

interface HistoryFiltersProps {
  values: HistoryFilterValues;
  onChange: (values: HistoryFilterValues) => void;
}

export function HistoryFilters({ values, onChange }: HistoryFiltersProps) {
  function update(partial: Partial<HistoryFilterValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              placeholder="Search decisions..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div>
          <label htmlFor="history-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="history-status"
            value={values.status}
            onChange={(e) => update({ status: e.target.value as DecisionRecordStatus | "all" })}
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}