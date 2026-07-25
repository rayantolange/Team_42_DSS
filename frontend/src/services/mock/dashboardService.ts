import { DEPARTMENTS, POLICIES } from "@/data/datasetLoader";
import { DECISIONS } from "@/data/decisionGenerator";
import type { Decision } from "@/types/domain";
import { mockDelay, maybeThrowMockError } from "./mockUtils";

export interface DashboardMetrics {
  totalDecisions: number;
  totalPolicies: number;
  totalDepartments: number;
  outcomeBreakdown: { sentiment: string; count: number }[];
  departmentComparison: DepartmentComparisonRow[];
  recentDecisions: Decision[];
}

export interface DepartmentComparisonRow {
  departmentId: string;
  departmentName: string;
  totalDecisions: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface TrendPoint {
  month: string; // "2026-01"
  approved: number;
  rejected: number;
  deferred: number;
}

/** Restricts decisions to a single department when one is selected (non-admin view or filter). */
function scopeDecisions(departmentId: string | null): Decision[] {
  if (!departmentId) return DECISIONS;
  return DECISIONS.filter((d) => d.departmentId === departmentId);
}

export async function fetchDashboardMetrics(
  departmentId: string | null
): Promise<DashboardMetrics> {
  await mockDelay(450);
  maybeThrowMockError("fetchDashboardMetrics");

  const decisions = scopeDecisions(departmentId);
  const departments = departmentId
    ? DEPARTMENTS.filter((d) => d.id === departmentId)
    : DEPARTMENTS;

  const outcomeCounts: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
  for (const d of decisions) {
    outcomeCounts[d.outcomeSentiment] = (outcomeCounts[d.outcomeSentiment] ?? 0) + 1;
  }

  const departmentComparison: DepartmentComparisonRow[] = departments.map((dept) => {
    const deptDecisions = DECISIONS.filter((d) => d.departmentId === dept.id);
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalDecisions: deptDecisions.length,
      positive: deptDecisions.filter((d) => d.outcomeSentiment === "positive").length,
      negative: deptDecisions.filter((d) => d.outcomeSentiment === "negative").length,
      neutral: deptDecisions.filter((d) => d.outcomeSentiment === "neutral").length,
    };
  });

  const recentDecisions = [...decisions]
    .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
    .slice(0, 8);

  return {
    totalDecisions: decisions.length,
    totalPolicies: departmentId
      ? POLICIES.filter((p) => p.departmentId === departmentId).length
      : POLICIES.length,
    totalDepartments: departments.length,
    outcomeBreakdown: Object.entries(outcomeCounts).map(([sentiment, count]) => ({
      sentiment,
      count,
    })),
    departmentComparison,
    recentDecisions,
  };
}

export async function fetchDashboardTrends(
  departmentId: string | null
): Promise<TrendPoint[]> {
  await mockDelay(400);
  maybeThrowMockError("fetchDashboardTrends");

  const decisions = scopeDecisions(departmentId);
  const buckets = new Map<string, TrendPoint>();

  for (const d of decisions) {
    const month = d.dateCreated.slice(0, 7); // "YYYY-MM"
    if (!buckets.has(month)) {
      buckets.set(month, { month, approved: 0, rejected: 0, deferred: 0 });
    }
    const bucket = buckets.get(month);
    if (!bucket) continue;

    if (d.status === "approved" || d.status === "implemented") {
      bucket.approved += 1;
    } else if (d.status === "rejected" || d.status === "under_review") {
      bucket.rejected += 1;
    } else {
      bucket.deferred += 1;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
}
