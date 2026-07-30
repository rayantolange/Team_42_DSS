import { apiClient } from "./apiClient";
import type {
  DecisionRecord,
  DecisionRecordSummary,
  DecisionCreateInput,
  DecisionUpdateInput,
  DecisionRecordStatus,
} from "@/types/domain";
import type { RawGraphData } from "@features/graph/useGraphData";

interface DecisionResponseWire {
  decision_id: number;
  department_id: number;
  created_by: number;
  title: string;
  problem_statement: string;
  decision_desc: string;
  decision_type?: string | null;
  status: DecisionRecordStatus;
  decision_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface DecisionSummaryWire {
  decision_id: number;
  title: string;
  decision_type?: string | null;
  status: DecisionRecordStatus;
  decision_date?: string | null;
  created_at: string;
}

function toDecision(w: DecisionResponseWire): DecisionRecord {
  return {
    decisionId: w.decision_id,
    departmentId: w.department_id,
    createdBy: w.created_by,
    title: w.title,
    problemStatement: w.problem_statement,
    decisionDesc: w.decision_desc,
    decisionType: w.decision_type ?? undefined,
    status: w.status,
    decisionDate: w.decision_date ?? undefined,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

function toDecisionSummary(w: DecisionSummaryWire): DecisionRecordSummary {
  return {
    decisionId: w.decision_id,
    title: w.title,
    decisionType: w.decision_type ?? undefined,
    status: w.status,
    decisionDate: w.decision_date ?? undefined,
    createdAt: w.created_at,
  };
}

export interface DecisionFilters {
  statusFilter?: DecisionRecordStatus;
  skip?: number;
  limit?: number;
}

export async function fetchDecisions(
  filters: DecisionFilters = {}
): Promise<DecisionRecordSummary[]> {
  const { data } = await apiClient.get<DecisionSummaryWire[]>("/decisions", {
    params: {
      status_filter: filters.statusFilter,
      skip: filters.skip ?? 0,
      limit: filters.limit ?? 100,
    },
  });
  return data.map(toDecisionSummary);
}

export async function fetchDecisionById(decisionId: number): Promise<DecisionRecord> {
  const { data } = await apiClient.get<DecisionResponseWire>(
    `/decisions/${decisionId}`
  );
  return toDecision(data);
}

export async function createDecision(
  input: DecisionCreateInput
): Promise<DecisionRecord> {
  const { data } = await apiClient.post<DecisionResponseWire>("/decisions", {
    title: input.title,
    problem_statement: input.problemStatement,
    decision_desc: input.decisionDesc,
    decision_type: input.decisionType,
    decision_date: input.decisionDate,
  });
  return toDecision(data);
}

export async function updateDecision(
  decisionId: number,
  input: DecisionUpdateInput
): Promise<DecisionRecord> {
  const { data } = await apiClient.patch<DecisionResponseWire>(
    `/decisions/${decisionId}`,
    {
      title: input.title,
      problem_statement: input.problemStatement,
      decision_desc: input.decisionDesc,
      decision_type: input.decisionType,
      status: input.status,
      decision_date: input.decisionDate,
    }
  );
  return toDecision(data);
}

export async function updateDecisionStatus(
  decisionId: number,
  newStatus: DecisionRecordStatus
): Promise<DecisionRecord> {
  const { data } = await apiClient.patch<DecisionResponseWire>(
    `/decisions/${decisionId}/status`,
    null,
    { params: { new_status: newStatus } }
  );
  return toDecision(data);
}

interface GraphDecisionWire {
  decision_id: number;
  title: string;
  decision_type?: string | null;
  status: DecisionRecordStatus;
}

interface GraphStrategyLinkWire {
  strategy_id: number;
  strategy_name: string;
}

interface GraphConstraintLinkWire {
  constraint_id: number;
  constraint_type: string;
}

interface GraphOutcomeLinkWire {
  outcome_id: number;
  outcome_status: string;
}

interface GraphLinksWire {
  strategies: GraphStrategyLinkWire[];
  constraints: GraphConstraintLinkWire[];
  outcomes: GraphOutcomeLinkWire[];
}

interface GraphResponseWire {
  decisions: GraphDecisionWire[];
  links_by_decision: Record<number, GraphLinksWire>;
}

export async function fetchGraphData(statusFilter?: DecisionRecordStatus): Promise<RawGraphData> {
  const { data } = await apiClient.get<GraphResponseWire>("/decisions/graph", {
    params: { status_filter: statusFilter },
  });

  const decisions = data.decisions.map((d) => ({
    decisionId: d.decision_id,
    title: d.title,
    decisionType: d.decision_type ?? undefined,
    status: d.status,
  }));

  const linksByDecision: RawGraphData["linksByDecision"] = {};
  Object.entries(data.links_by_decision).forEach(([decisionId, links]) => {
    linksByDecision[Number(decisionId)] = {
      strategies: links.strategies.map((s) => ({
        strategyId: s.strategy_id,
        strategyName: s.strategy_name,
      })),
      constraints: links.constraints.map((c) => ({
        constraintId: c.constraint_id,
        constraintType: c.constraint_type,
      })),
      outcomes: links.outcomes.map((o) => ({
        outcomeId: o.outcome_id,
        outcomeStatus: o.outcome_status,
      })),
    };
  });

  return { decisions, linksByDecision };
}