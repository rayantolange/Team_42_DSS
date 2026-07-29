// src/pages/MyVaultPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, AlertCircle, Download } from "lucide-react";
import { useAllDocuments } from "@features/decisions/useDecisionDocuments";
import { useAllStrategies } from "@features/decisions/useStrategies";
import { useAllConstraints } from "@features/decisions/useConstraints";
import { useAllOutcomes } from "@features/decisions/useOutcomes";
import { getDocumentDownloadUrl } from "@services/decisionDocumentService";
import { Skeleton } from "@components/ui/Skeleton";

const TABS = ["Documents", "Strategies", "Constraints", "Outcomes"] as const;
type Tab = (typeof TABS)[number];

export default function MyVaultPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Documents");

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/60 via-background to-violet/[0.04] p-6">
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight">My Vault</h1>
          <p className="text-muted-foreground">
            All documents, strategies, constraints, and outcomes across your decisions
          </p>
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

      {activeTab === "Documents" && <DocumentsVaultTab />}
      {activeTab === "Strategies" && <StrategiesVaultTab />}
      {activeTab === "Constraints" && <ConstraintsVaultTab />}
      {activeTab === "Outcomes" && <OutcomesVaultTab />}
    </div>
  );
}

function DocumentsVaultTab() {
  const { data, isLoading, isError } = useAllDocuments();

  async function handleDownload(documentId: number) {
    const url = await getDocumentDownloadUrl(documentId);
    window.open(url, "_blank");
  }

  if (isError) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Unable to load documents.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No documents yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((doc) => (
        <div
          key={doc.documentId}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate text-sm font-medium">{doc.fileName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              to={`/decisions/${doc.decisionId}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View decision
            </Link>
            <button
              onClick={() => handleDownload(doc.documentId)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label={`Download ${doc.fileName}`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StrategiesVaultTab() {
  const { data, isLoading, isError } = useAllStrategies();

  if (isError) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Unable to load strategies.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No strategies yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((s) => (
        <div key={s.strategyId} className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">{s.strategyName}</p>
          {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
        </div>
      ))}
    </div>
  );
}

function ConstraintsVaultTab() {
  const { data, isLoading, isError } = useAllConstraints();

  if (isError) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Unable to load constraints.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No constraints yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((c) => (
        <div key={c.constraintId} className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium capitalize">{c.constraintType.replace("_", " ")}</p>
          {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ))}
    </div>
  );
}

function OutcomesVaultTab() {
  const { data, isLoading, isError } = useAllOutcomes();

  if (isError) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Unable to load outcomes.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No outcomes yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((o) => (
        <div
          key={o.outcomeId}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium capitalize">
              {o.outcomeStatus.replace("_", " ")}
            </span>
            {o.successScore != null && (
              <span className="ml-2 text-xs text-muted-foreground">Score: {o.successScore}</span>
            )}
          </div>
          <Link
            to={`/decisions/${o.decisionId}`}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            View decision
          </Link>
        </div>
      ))}
    </div>
  );
}