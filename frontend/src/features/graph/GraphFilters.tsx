import { Search } from "lucide-react";
import type { GraphEntityType } from "@features/graph/useGraphData";
import { cn } from "@utils/cn";

interface EntityTypeOption {
  type: GraphEntityType;
  label: string;
}

const ENTITY_TYPE_OPTIONS: EntityTypeOption[] = [
  { type: "decision", label: "Decisions" },
  { type: "strategy", label: "Strategies" },
  { type: "constraint", label: "Constraints" },
  { type: "outcome", label: "Outcomes" },
];

interface GraphFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedEntityTypes: GraphEntityType[];
  onToggleEntityType: (type: GraphEntityType) => void;
}

export function GraphFilters({
  searchTerm,
  onSearchTermChange,
  selectedEntityTypes,
  onToggleEntityType,
}: GraphFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1">
        <label htmlFor="graph-search" className="text-sm font-medium">
          Search the graph
        </label>
        <div className="relative mt-1.5">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="graph-search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search by name..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">Show</legend>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter entity types shown in the graph">
          {ENTITY_TYPE_OPTIONS.map((option) => {
            const active = selectedEntityTypes.includes(option.type);
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onToggleEntityType(option.type)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}