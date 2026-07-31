/**
 * Core domain types for the Decision Support System.
 *
 * These model the knowledge graph entities backing the app, matching
 * the actual "Simulated College Institutional Policy Dataset"
 * (Nepal Higher Education context) used to seed mock data:
 *
 *   Policy -> Department | Policy -> Role | Policy -> Regulation
 *   Policy -> Decision   | Decision -> Outcome
 *
 * "Decisions" in the UI are policy application events: an instance of
 * a Policy being invoked in a particular Decision Context, resulting
 * in one of that Policy's defined Outcomes. The Policy itself is the
 * durable knowledge-graph node; Decisions are the historical events
 * explored in Decision History / Query / Graph Explorer.
 */

export type EntityType =
  | "department"
  | "policy"
  | "decision"
  | "regulation"
  | "role"
  | "outcome";

export type UserRole = "admin" | "principal" | "hod" | "faculty" | "staff";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "System Administrator",
  principal: "Principal",
  hod: "Head of Department",
  faculty: "Faculty",
  staff: "Staff",
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string; // required if role === "department_head"
}

export type DepartmentType = "Academic" | "Administrative";

export interface Department {
  id: string;
  name: string;
  type: DepartmentType;
  description: string;
  policyCount: number;
  keyRegulations: string[];
  isActive: boolean;
}

export interface KeyResponsibility {
  role: string;
  responsibility: string;
}

export type OutcomeSentiment = "positive" | "negative" | "neutral";

export interface PolicyOutcome {
  label: string;
  sentiment: OutcomeSentiment;
  action: string;
}

export interface Policy {
  id: string; // e.g. "BAD-POL-001"
  departmentId: string;
  title: string;
  category: string;
  description: string;
  scope: string;
  keyResponsibilities: KeyResponsibility[];
  relatedEntities: string[];
  decisionContext: string;
  legalBasis: string[];
  constraints: string[];
  outcomes: PolicyOutcome[];
}

export type DecisionStatus =
  | "approved"
  | "rejected"
  | "deferred"
  | "conditional"
  | "implemented"
  | "under_review";

/**
 * A Decision is a simulated historical event: a specific instance of
 * a Policy being applied, with one of its outcomes realized. These
 * are derived/generated from the policy dataset for Dashboard,
 * History, and Graph exploration, since the raw dataset describes
 * policies (the rules) rather than logged individual decisions.
 */
export interface Decision {
  id: string;
  policyId: string;
  departmentId: string;
  title: string;
  summary: string;
  status: DecisionStatus;
  dateCreated: string; // ISO 8601
  dateResolved?: string;
  outcomeLabel: string;
  outcomeSentiment: OutcomeSentiment;
  tags: string[];
  documentIds: string[];
}

export interface Regulation {
  id: string;
  name: string;
  jurisdiction: "Nepal" | "International Reference";
  relatedPolicyIds: string[];
}

export interface GraphNodeData {
  entityType: EntityType;
  label: string;
  entityId: string;
  subtitle?: string;
  status?: string;
}

export interface GraphEdgeData {
  relationship: string; // human-readable, e.g. "governs", "led to", "constrained by"
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  status: "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
  linkedDecisionId?: string;
  linkedPolicyId?: string;
}

export type DecisionRecordStatus =
  | "draft"
  | "approved"
  | "implemented"
  | "completed"
  | "cancelled";

export interface DecisionRecord {
  decisionId: number;
  departmentId: number;
  createdBy: number;
  title: string;
  problemStatement: string;
  decisionDesc: string;
  decisionType?: string;
  status: DecisionRecordStatus;
  decisionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionRecordSummary {
  decisionId: number;
  title: string;
  decisionType?: string;
  status: DecisionRecordStatus;
  decisionDate?: string;
  createdAt: string;
}

export interface DecisionCreateInput {
  title: string;
  problemStatement: string;
  decisionDesc: string;
  decisionType?: string;
  decisionDate?: string;
}

export interface DecisionUpdateInput {
  title?: string;
  problemStatement?: string;
  decisionDesc?: string;
  decisionType?: string;
  status?: DecisionRecordStatus;
  decisionDate?: string;
}

export interface Strategy {
  strategyId: number;
  strategyName: string;
  description?: string;
  createdAt: string;
}

export interface StrategyCreateInput {
  strategyName: string;
  description?: string;
}

export const CONSTRAINT_TYPES = [
  "financial",
  "regulatory",
  "operational",
  "technical",
  "human_resource",
  "time",
  "infrastructure",
] as const;
export type ConstraintType = (typeof CONSTRAINT_TYPES)[number];

export interface ConstraintItem {
  constraintId: number;
  constraintType: ConstraintType;
  description?: string;
  createdAt: string;
}

export interface ConstraintCreateInput {
  constraintType: ConstraintType;
  description?: string;
}

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface DecisionDocument {
  documentId: number;
  decisionId: number;
  uploadedBy: number;
  fileName: string;
  filePath?: string;
  uploadDate?: string;
  createdAt: string;
  status: DocumentStatus;
  statusMessage?: string;
}

export type OutcomeStatus = "successful" | "partially_successful" | "failed";

export interface Outcome {
  outcomeId: number;
  decisionId: number;
  outcomeStatus: OutcomeStatus;
  outcomeDesc?: string;
  successScore?: number;
  evaluationDate?: string;
  createdAt: string;
}

export interface OutcomeCreateInput {
  outcomeStatus: OutcomeStatus;
  outcomeDesc?: string;
  successScore?: number;
  evaluationDate?: string;
}