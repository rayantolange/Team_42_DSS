import { DEPARTMENTS } from "@services/index";

interface DepartmentFilterProps {
  value: string | null;
  onChange: (departmentId: string | null) => void;
}

/**
 * Department selector for the Dashboard. Only rendered for admins —
 * department heads are scoped to their own department automatically
 * and don't see this control (handled by the page, not this file).
 */
export function DepartmentFilter({ value, onChange }: DepartmentFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="department-filter" className="text-sm font-medium">
        Department
      </label>
      <select
        id="department-filter"
        value={value ?? "all"}
        onChange={(e) => onChange(e.target.value === "all" ? null : e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">All Departments</option>
        {DEPARTMENTS.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
    </div>
  );
}
