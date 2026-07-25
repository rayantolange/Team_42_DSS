import { Search } from "lucide-react";
import { DEPARTMENTS } from "@services/index";
import type { EntityType } from "@/types/domain";
import { cn } from "@utils/cn";

interface EntityTypeOption {
  type: EntityType;
  label: string;
}

// Organizational terminology, not raw graph jargon ("node"/"vertex").
const ENTITY_TYPE_OPTIONS: EntityTypeOption[] = [
  { type: "department", label: "Departments" },
  { type: "policy", label: "Policies" },
  { type: "decision", label: "Decisions" },
  { type: "outcome", label: "Outcomes" },
  { type: "regulation", label: "Regulations" },
];

interface GraphFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedEntityTypes: EntityType[];
  onToggleEntityType: (type: EntityType) => void;
  departmentId: string | null;
  onDepartmentChange: (departmentId: string | null) => void;
  isAdmin: boolean;
}

export function GraphFilters({
  searchTerm,
  onSearchTermChange,
  selectedEntityTypes,
  onToggleEntityType,
  departmentId,
  onDepartmentChange,
  isAdmin,
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
            placeholder="Search by name, e.g. 'Finance' or 'Academic Integrity'"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {isAdmin && (
        <div>
          <label htmlFor="graph-department" className="text-sm font-medium">
            Department
          </label>
          <select
            id="graph-department"
            value={departmentId ?? "all"}
            onChange={(e) => onDepartmentChange(e.target.value === "all" ? null : e.target.value)}
            className="mt-1.5 h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
