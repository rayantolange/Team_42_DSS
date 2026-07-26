import { DECISIONS } from "@/data/decisionGenerator";
import { getPolicyById } from "@/data/datasetLoader";
import type { Decision, DecisionStatus } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";
import { mockDelay, maybeThrowMockError } from "./mockUtils";

export interface DecisionFilters {
  departmentId?: string | null;
  status?: DecisionStatus[];
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchDecisions(
  filters: DecisionFilters
): Promise<PaginatedResponse<Decision>> {
  await mockDelay(350);
  maybeThrowMockError("fetchDecisions");

  const {
    departmentId,
    status,
    searchTerm,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 10,
  } = filters;

  let results = DECISIONS;

  if (departmentId) {
    results = results.filter((d) => d.departmentId === departmentId);
  }

  if (status && status.length > 0) {
    results = results.filter((d) => status.includes(d.status));
  }

  if (dateFrom) {
    const from = new Date(dateFrom).getTime();
    results = results.filter((d) => new Date(d.dateCreated).getTime() >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo).getTime();
    results = results.filter((d) => new Date(d.dateCreated).getTime() <= to);
  }

  if (searchTerm && searchTerm.trim().length > 0) {
    const term = searchTerm.trim().toLowerCase();
    results = results.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.summary.toLowerCase().includes(term) ||
        d.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const items = results.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

export async function fetchDecisionById(id: string): Promise<Decision> {
  await mockDelay(250);
  const decision = DECISIONS.find((d) => d.id === id);
  if (!decision) {
    throw new Error(`Decision not found: ${id}`);
  }
  return decision;
}

/** Convenience: full policy context for a decision's detail modal. */
export async function fetchDecisionPolicyContext(decisionId: string) {
  await mockDelay(200);
  const decision = DECISIONS.find((d) => d.id === decisionId);
  if (!decision) {
    throw new Error(`Decision not found: ${decisionId}`);
  }
  const policy = getPolicyById(decision.policyId);
  return { decision, policy };
}
