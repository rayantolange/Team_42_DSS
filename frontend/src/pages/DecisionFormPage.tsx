import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useCreateDecision } from "@features/decisions/useDecisions";

const DECISION_TYPES = [
  "academic",
  "financial",
  "administrative",
  "infrastructure",
  "policy",
  "other",
];

export default function DecisionFormPage() {
  const navigate = useNavigate();
  const createDecision = useCreateDecision();

  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [decisionDesc, setDecisionDesc] = useState("");
  const [decisionType, setDecisionType] = useState("");
  const [decisionDate, setDecisionDate] = useState("");

  const canSubmit =
    title.trim().length >= 3 &&
    problemStatement.trim().length >= 10 &&
    decisionDesc.trim().length >= 10;

  async function handleNext() {
    if (!canSubmit) return;
    try {
      const created = await createDecision.mutateAsync({
        title: title.trim(),
        problemStatement: problemStatement.trim(),
        decisionDesc: decisionDesc.trim(),
        decisionType: decisionType || undefined,
        decisionDate: decisionDate || undefined,
      });
      // Move to step 2 (documents) of the wizard for the new decision
      navigate(`/decisions/${created.decisionId}/new/documents`);
    } catch {
      // error surfaced via createDecision.isError below
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Decision</h1>
        <p className="text-muted-foreground">Step 1 of 4</p>
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              step === 1 ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {createDecision.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Failed to create decision. Please check the fields and try again.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="problemStatement">
            Problem Statement
          </label>
          <textarea
            id="problemStatement"
            rows={3}
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="decisionDesc">
            Decision Description
          </label>
          <textarea
            id="decisionDesc"
            rows={3}
            value={decisionDesc}
            onChange={(e) => setDecisionDesc(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="decisionType">
              Decision Type
            </label>
            <select
              id="decisionType"
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select type...</option>
              {DECISION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="decisionDate">
              Decision Date
            </label>
            <input
              id="decisionDate"
              type="date"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!canSubmit || createDecision.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createDecision.isPending ? "Saving..." : "Save & Continue"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
