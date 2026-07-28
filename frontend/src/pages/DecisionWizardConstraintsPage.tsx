import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, X, AlertCircle } from "lucide-react";
import {
  useAllConstraints,
  useConstraintsForDecision,
  useCreateConstraint,
  useLinkConstraint,
  useUnlinkConstraint,
} from "@features/decisions/useConstraints";
import { CONSTRAINT_TYPES, type ConstraintType } from "@/types/domain";

export default function DecisionWizardConstraintsPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();

  const { data: allConstraints, isLoading: loadingAll } = useAllConstraints();
  const { data: linkedConstraints, isLoading: loadingLinked } =
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

  function handleAttachExisting() {
    if (!selectedId) return;
    linkConstraint.mutate(Number(selectedId), {
      onSuccess: () => setSelectedId(""),
    });
  }

  async function handleCreateAndAttach() {
    if (!newType) return;
    try {
      const created = await createConstraint.mutateAsync({
        constraintType: newType,
        description: newDesc.trim() || undefined,
      });
      await linkConstraint.mutateAsync(created.constraintId);
      setNewType("");
      setNewDesc("");
      setShowCreateForm(false);
    } catch {
      // surfaced via isError below
    }
  }

  const anyError = createConstraint.isError || linkConstraint.isError;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supporting Constraints
        </h1>
        <p className="text-muted-foreground">Step 4 of 4</p>
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="h-1.5 flex-1 rounded-full bg-primary" />
        ))}
      </div>

      {anyError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Something went wrong. Please try again.</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-sm font-semibold">Attached constraints</h2>
        {loadingLinked ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        ) : linkedConstraints && linkedConstraints.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
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
          <p className="mt-3 text-sm text-muted-foreground">
            No constraints attached yet.
          </p>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <label className="text-sm font-medium">
            Attach an existing constraint
          </label>
          <div className="mt-2 flex gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingAll}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              onClick={handleAttachExisting}
              disabled={!selectedId || linkConstraint.isPending}
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
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAndAttach}
                  disabled={!newType || createConstraint.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {createConstraint.isPending
                    ? "Creating..."
                    : "Create & Attach"}
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

      <div className="flex justify-between">
        <button
          onClick={() => navigate(`/decisions/${decisionId}/new/strategies`)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          onClick={() => navigate(`/decisions/${decisionId}`)}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
            linkedConstraints && linkedConstraints.length > 0
              ? "bg-primary text-primary-foreground shadow-sm hover:scale-[1.02] hover:shadow-glow"
              : "border border-border bg-transparent text-foreground hover:bg-accent"
          }`}
        >
          Finish
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
