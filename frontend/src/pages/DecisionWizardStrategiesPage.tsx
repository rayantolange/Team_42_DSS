import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, X, AlertCircle } from "lucide-react";
import {
  useAllStrategies,
  useStrategiesForDecision,
  useCreateStrategy,
  useLinkStrategy,
  useUnlinkStrategy,
} from "@features/decisions/useStrategies";

export default function DecisionWizardStrategiesPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();

  const { data: allStrategies, isLoading: loadingAll } = useAllStrategies();
  const { data: linkedStrategies, isLoading: loadingLinked } =
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
    (s) => !linkedIds.has(s.strategyId)
  );

  function handleAttachExisting() {
    if (!selectedId) return;
    linkStrategy.mutate(Number(selectedId), {
      onSuccess: () => setSelectedId(""),
    });
  }

  async function handleCreateAndAttach() {
    if (newName.trim().length < 3) return;
    try {
      const created = await createStrategy.mutateAsync({
        strategyName: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      await linkStrategy.mutateAsync(created.strategyId);
      setNewName("");
      setNewDesc("");
      setShowCreateForm(false);
    } catch {
      // surfaced via isError below
    }
  }

  const anyError = createStrategy.isError || linkStrategy.isError;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Decision</h1>
        <p className="text-muted-foreground">Step 3 of 4 — Strategies (optional)</p>
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= 3 ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {anyError && (
        <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Something went wrong. Please try again.</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-sm font-semibold">Attached strategies</h2>
        {loadingLinked ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        ) : linkedStrategies && linkedStrategies.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
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
          <p className="mt-3 text-sm text-muted-foreground">No strategies attached yet.</p>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <label className="text-sm font-medium">Attach an existing strategy</label>
          <div className="mt-2 flex gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingAll}
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
              onClick={handleAttachExisting}
              disabled={!selectedId || linkStrategy.isPending}
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
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
                  disabled={newName.trim().length < 3 || createStrategy.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {createStrategy.isPending ? "Creating..." : "Create & Attach"}
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
          onClick={() => navigate(`/decisions/${decisionId}/new/documents`)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          onClick={() => navigate(`/decisions/${decisionId}/new/constraints`)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-glow active:scale-95"
        >
          Next
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}