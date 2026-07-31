// src/pages/DecisionDetailPage.tsx
import { useState, useRef, type ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Plus,
  AlertCircle,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useDecision,
  useUpdateDecisionStatus,
} from "@features/decisions/useDecisions";
import {
  useDecisionDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@features/decisions/useDecisionDocuments";
import {
  useAllStrategies,
  useStrategiesForDecision,
  useCreateStrategy,
  useLinkStrategy,
  useUnlinkStrategy,
} from "@features/decisions/useStrategies";
import {
  useAllConstraints,
  useConstraintsForDecision,
  useCreateConstraint,
  useLinkConstraint,
  useUnlinkConstraint,
} from "@features/decisions/useConstraints";
import {
  useOutcomesForDecision,
  useCreateOutcome,
  useDeleteOutcome,
} from "@features/decisions/useOutcomes";
import { getDocumentDownloadUrl } from "@services/decisionDocumentService";
import {
  CONSTRAINT_TYPES,
  type ConstraintType,
  type DecisionRecordStatus,
  type OutcomeStatus,
} from "@/types/domain";

const TABS = [
  "Overview",
  "Documents",
  "Strategies",
  "Constraints",
  "Outcomes",
] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLES: Record<DecisionRecordStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-100 text-blue-700",
  implemented: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
};

const NEXT_STATUS: Record<DecisionRecordStatus, DecisionRecordStatus | null> = {
  draft: "approved",
  approved: "implemented",
  implemented: "completed",
  completed: null,
  cancelled: null,
};

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const { data: decision, isLoading, isError } = useDecision(decisionId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading decision...</p>;
  }
  if (isError || !decision) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
      >
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Unable to load this decision.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/decisions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Decisions
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/60 via-background to-violet/[0.04] p-6">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {decision.title}
            </h1>
            {decision.decisionType && (
              <p className="mt-1 text-sm text-muted-foreground">
                {decision.decisionType}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[decision.status]}`}
          >
            {decision.status}
          </span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "Overview" && <OverviewTab decisionId={decisionId} />}
        {activeTab === "Documents" && <DocumentsTab decisionId={decisionId} />}
        {activeTab === "Strategies" && (
          <StrategiesTab decisionId={decisionId} />
        )}
        {activeTab === "Constraints" && (
          <ConstraintsTab decisionId={decisionId} />
        )}
        {activeTab === "Outcomes" && (
          <OutcomesTab
            decisionId={decisionId}
            decisionStatus={decision.status}
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ decisionId }: { decisionId: number }) {
  const { data: decision } = useDecision(decisionId);
  const updateStatus = useUpdateDecisionStatus(decisionId);
  if (!decision) return null;

  const nextStatus = NEXT_STATUS[decision.status];

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">
          Problem Statement
        </h3>
        <p className="mt-1 text-sm">{decision.problemStatement}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">
          Decision Description
        </h3>
        <p className="mt-1 text-sm">{decision.decisionDesc}</p>
      </div>
      {decision.decisionDate && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">
            Decision Date
          </h3>
          <p className="mt-1 text-sm">
            {new Date(decision.decisionDate).toLocaleDateString()}
          </p>
        </div>
      )}
      {nextStatus && decision.status !== "cancelled" && (
        <div className="border-t border-border pt-4">
          <button
            onClick={() => updateStatus.mutate(nextStatus)}
            disabled={updateStatus.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {updateStatus.isPending
              ? "Updating..."
              : `Advance to "${nextStatus}"`}
          </button>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ decisionId }: { decisionId: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents, isLoading } = useDecisionDocuments(decisionId);
  const upload = useUploadDocument(decisionId);
  const remove = useDeleteDocument(decisionId);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  }

  async function handleDownload(documentId: number) {
    const url = await getDocumentDownloadUrl(documentId);
    window.open(url, "_blank");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={upload.isPending}
        className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
      >
        <Upload className="h-5 w-5" aria-hidden="true" />
        {upload.isPending ? "Uploading..." : "Click to upload a document"}
      </button>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Loading documents...
        </p>
      ) : documents && documents.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.documentId}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span className="block truncate">{doc.fileName}</span>
                  {doc.status === "failed" && doc.statusMessage && (
                    <span className="block truncate text-xs text-destructive">
                      {doc.statusMessage}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {(doc.status === "pending" || doc.status === "processing") && (
                  <Loader2
                    className="h-4 w-4 animate-spin text-primary"
                    aria-label="Processing"
                  />
                )}
                {doc.status === "completed" && (
                  <CheckCircle2
                    className="h-4 w-4 text-success"
                    aria-label="Ready"
                  />
                )}
                {doc.status === "failed" && (
                  <AlertCircle
                    className="h-4 w-4 text-destructive"
                    aria-label="Failed"
                  />
                )}
                <button
                  onClick={() => handleDownload(doc.documentId)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                  aria-label={`Download ${doc.fileName}`}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => remove.mutate(doc.documentId)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${doc.fileName}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No documents attached yet.
        </p>
      )}
    </div>
  );
}

function StrategiesTab({ decisionId }: { decisionId: number }) {
  const { data: allStrategies } = useAllStrategies();
  const { data: linkedStrategies, isLoading } =
    useStrategiesForDecision(decisionId);
  const createStrategy = useCreateStrategy();
  const linkStrategy = useLinkStrategy(decisionId);
  const unlinkStrategy = useUnlinkStrategy(decisionId);

  const [selectedId, setSelectedId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const linkedIds = new Set((linkedStrategies ?? []).map((s) => s.strategyId));
  const availableStrategies = (allStrategies ?? []).filter(
    (s) => !linkedIds.has(s.strategyId),
  );

  async function handleCreateAndAttach() {
    if (newName.trim().length < 3) return;
    const created = await createStrategy.mutateAsync({
      strategyName: newName.trim(),
      description: newDesc.trim() || undefined,
    });
    await linkStrategy.mutateAsync(created.strategyId);
    setNewName("");
    setNewDesc("");
    setShowCreateForm(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : linkedStrategies && linkedStrategies.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {linkedStrategies.map((s) => (
            <li
              key={s.strategyId}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{s.strategyName}</span>
              <button
                onClick={() => unlinkStrategy.mutate(s.strategyId)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${s.strategyName}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No strategies attached yet.
        </p>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a strategy...</option>
            {availableStrategies.map((s) => (
              <option key={s.strategyId} value={s.strategyId}>
                {s.strategyName}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              selectedId &&
              linkStrategy.mutate(Number(selectedId), {
                onSuccess: () => setSelectedId(""),
              })
            }
            disabled={!selectedId}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            Attach
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create a new strategy
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Strategy name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description (optional)"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateAndAttach}
                disabled={newName.trim().length < 3}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Create & Attach
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConstraintsTab({ decisionId }: { decisionId: number }) {
  const { data: allConstraints } = useAllConstraints();
  const { data: linkedConstraints, isLoading } =
    useConstraintsForDecision(decisionId);
  const createConstraint = useCreateConstraint();
  const linkConstraint = useLinkConstraint(decisionId);
  const unlinkConstraint = useUnlinkConstraint(decisionId);

  const [selectedId, setSelectedId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newType, setNewType] = useState<ConstraintType | "">("");
  const [newDesc, setNewDesc] = useState("");

  const linkedIds = new Set(
    (linkedConstraints ?? []).map((c) => c.constraintId),
  );
  const availableConstraints = (allConstraints ?? []).filter(
    (c) => !linkedIds.has(c.constraintId),
  );

  async function handleCreateAndAttach() {
    if (!newType) return;
    const created = await createConstraint.mutateAsync({
      constraintType: newType,
      description: newDesc.trim() || undefined,
    });
    await linkConstraint.mutateAsync(created.constraintId);
    setNewType("");
    setNewDesc("");
    setShowCreateForm(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : linkedConstraints && linkedConstraints.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {linkedConstraints.map((c) => (
            <li
              key={c.constraintId}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <div className="flex flex-col truncate">
                <span className="truncate font-medium capitalize">
                  {c.constraintType.replace("_", " ")}
                </span>
                {c.description && (
                  <span className="truncate text-xs text-muted-foreground">
                    {c.description}
                  </span>
                )}
              </div>
              <button
                onClick={() => unlinkConstraint.mutate(c.constraintId)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove constraint"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No constraints attached yet.
        </p>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a constraint...</option>
            {availableConstraints.map((c) => (
              <option key={c.constraintId} value={c.constraintId}>
                {c.constraintType.replace("_", " ")}
                {c.description ? ` — ${c.description.slice(0, 40)}` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              selectedId &&
              linkConstraint.mutate(Number(selectedId), {
                onSuccess: () => setSelectedId(""),
              })
            }
            disabled={!selectedId}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            Attach
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create a new constraint
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ConstraintType)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select constraint type...</option>
              {CONSTRAINT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Description (optional)"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateAndAttach}
                disabled={!newType}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Create & Attach
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const OUTCOME_STATUSES: OutcomeStatus[] = [
  "successful",
  "partially_successful",
  "failed",
];

function OutcomesTab({
  decisionId,
  decisionStatus,
}: {
  decisionId: number;
  decisionStatus: DecisionRecordStatus;
}) {
  const canRecordOutcome =
    decisionStatus === "implemented" || decisionStatus === "completed";
  const { data: outcomes, isLoading } = useOutcomesForDecision(decisionId);
  const createOutcome = useCreateOutcome(decisionId);
  const deleteOutcome = useDeleteOutcome(decisionId);

  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<OutcomeStatus | "">("");
  const [desc, setDesc] = useState("");
  const [score, setScore] = useState("");
  const [evalDate, setEvalDate] = useState("");

  async function handleCreate() {
    if (!status) return;
    await createOutcome.mutateAsync({
      outcomeStatus: status,
      outcomeDesc: desc.trim() || undefined,
      successScore: score ? Number(score) : undefined,
      evaluationDate: evalDate || undefined,
    });
    setStatus("");
    setDesc("");
    setScore("");
    setEvalDate("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        {!canRecordOutcome ? (
          <p className="text-sm text-muted-foreground">
            Outcomes can only be recorded once this decision is Implemented or
            Completed. Advance the status from the Overview tab first.
          </p>
        ) : !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Record Outcome
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OutcomeStatus)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select outcome status...</option>
              {OUTCOME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Outcome description (optional)"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="Success score (0-100)"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!status || createOutcome.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {createOutcome.isPending ? "Saving..." : "Save Outcome"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading outcomes...</p>
      ) : outcomes && outcomes.length > 0 ? (
        <div className="flex flex-col gap-3">
          {outcomes.map((o) => (
            <div
              key={o.outcomeId}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium capitalize">
                  {o.outcomeStatus.replace("_", " ")}
                </span>
                <button
                  onClick={() => deleteOutcome.mutate(o.outcomeId)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete outcome"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {o.outcomeDesc && <p className="mt-2 text-sm">{o.outcomeDesc}</p>}
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                {o.successScore != null && <span>Score: {o.successScore}</span>}
                {o.evaluationDate && (
                  <span>
                    Evaluated: {new Date(o.evaluationDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No outcomes recorded yet.
        </p>
      )}
    </div>
  );
}
