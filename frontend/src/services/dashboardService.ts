import { apiClient } from "./apiClient";

export interface OutcomeBreakdownItem {
  status: "successful" | "partially_successful" | "failed";
  count: number;
}

export interface TrendPoint {
  month: string;
  draft: number;
  approved: number;
  implemented: number;
  completed: number;
  cancelled: number;
}

export interface DepartmentComparisonRow {
  departmentId: number;
  departmentName: string;
  successful: number;
  partiallySuccessful: number;
  failed: number;
}

export interface RecentDecision {
  decisionId: number;
  title: string;
  departmentName: string;
  status: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalDecisions: number;
  pendingDecisions: number;
  documentsIndexed: number;
  positiveOutcomeRate: number;
  outcomeCoveragePercent: number;
  outcomeBreakdown: OutcomeBreakdownItem[];
  decisionTrends: TrendPoint[];
  departmentComparison: DepartmentComparisonRow[];
  recentDecisions: RecentDecision[];
}

interface DashboardMetricsWire {
  total_decisions: number;
  pending_decisions: number;
  documents_indexed: number;
  positive_outcome_rate: number;
  outcome_coverage_percent: number;
  outcome_breakdown: { status: string; count: number }[];
  decision_trends: { month: string; status: string; count: number }[];
  department_comparison: {
    department_id: number;
    department_name: string;
    status: string;
    count: number;
  }[];
  recent_decisions: {
    decision_id: number;
    title: string;
    department_name: string;
    status: string;
    created_at: string;
  }[];
}

/** Pivots flat {month, status, count} rows into one row per month with a column per status. */
function pivotTrends(rows: DashboardMetricsWire["decision_trends"]): TrendPoint[] {
  const byMonth = new Map<string, TrendPoint>();
  for (const row of rows) {
    if (!byMonth.has(row.month)) {
      byMonth.set(row.month, {
        month: row.month,
        draft: 0,
        approved: 0,
        implemented: 0,
        completed: 0,
        cancelled: 0,
      });
    }
    const point = byMonth.get(row.month)!;
    if (row.status in point) {
      (point as unknown as Record<string, number>)[row.status] = row.count;
    }
  }
  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/** Pivots flat {department, status, count} rows into one row per department with a column per outcome status. */
function pivotDepartmentComparison(
  rows: DashboardMetricsWire["department_comparison"]
): DepartmentComparisonRow[] {
  const byDept = new Map<number, DepartmentComparisonRow>();
  for (const row of rows) {
    if (!byDept.has(row.department_id)) {
      byDept.set(row.department_id, {
        departmentId: row.department_id,
        departmentName: row.department_name,
        successful: 0,
        partiallySuccessful: 0,
        failed: 0,
      });
    }
    const dept = byDept.get(row.department_id)!;
    if (row.status === "successful") dept.successful = row.count;
    else if (row.status === "partially_successful") dept.partiallySuccessful = row.count;
    else if (row.status === "failed") dept.failed = row.count;
  }
  return Array.from(byDept.values());
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await apiClient.get<DashboardMetricsWire>("/dashboard/metrics");

  return {
    totalDecisions: data.total_decisions,
    pendingDecisions: data.pending_decisions,
    documentsIndexed: data.documents_indexed,
    positiveOutcomeRate: data.positive_outcome_rate,
    outcomeCoveragePercent: data.outcome_coverage_percent,
    outcomeBreakdown: data.outcome_breakdown.map((o) => ({
      status: o.status as OutcomeBreakdownItem["status"],
      count: o.count,
    })),
    decisionTrends: pivotTrends(data.decision_trends),
    departmentComparison: pivotDepartmentComparison(data.department_comparison),
    recentDecisions: data.recent_decisions.map((d) => ({
      decisionId: d.decision_id,
      title: d.title,
      departmentName: d.department_name,
      status: d.status,
      createdAt: d.created_at,
    })),
  };
}