import { useParams, useNavigate } from "react-router-dom";
import { useRef, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useDecisionDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@features/decisions/useDecisionDocuments";

export default function DecisionWizardDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = useDecisionDocuments(decisionId);
  const upload = useUploadDocument(decisionId);
  const remove = useDeleteDocument(decisionId);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supporting Documents
        </h1>
        <p className="text-muted-foreground">Step 2 of 4</p>
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= 2 ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {upload.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Upload failed. Please check the file type and try again.</span>
        </div>
      )}

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
          className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          {upload.isPending ? (
            <Loader2
              className="h-6 w-6 animate-spin text-primary"
              aria-hidden="true"
            />
          ) : (
            <Upload className="h-6 w-6" aria-hidden="true" />
          )}
          <span
            className={
              upload.isPending ? "animate-pulse text-primary" : undefined
            }
          >
            {upload.isPending ? "Uploading…" : "Click to upload a document"}
          </span>
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
                <div className="flex items-center gap-2 truncate">
                  <FileText
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{doc.fileName}</span>
                </div>
                <button
                  onClick={() => remove.mutate(doc.documentId)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${doc.fileName}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No documents added yet.
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => navigate(`/decisions/${decisionId}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          onClick={() => navigate(`/decisions/${decisionId}/new/strategies`)}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
            documents && documents.length > 0
              ? "bg-primary text-primary-foreground shadow-sm hover:scale-[1.02] hover:shadow-glow"
              : "border border-border bg-transparent text-foreground hover:bg-accent"
          }`}
        >
          Next
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
