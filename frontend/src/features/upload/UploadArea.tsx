import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { cn } from "@utils/cn";
import { uploadDocument, validateFile } from "@services/index";
import { useToast } from "@components/ui/Toast";
import type { UploadedDocument } from "@/types/domain";

interface InFlightUpload {
  localId: string;
  fileName: string;
  fileSizeBytes: number;
  progress: number;
  status: UploadedDocument["status"];
  errorMessage?: string;
}

interface UploadAreaProps {
  onUploadComplete: (doc: UploadedDocument) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drag-and-drop + click-to-browse PDF upload area. Each file gets an
 * independent progress entry (uploading -> processing -> complete /
 * error) and a toast notification on completion, satisfying the
 * "Success/Error notifications" requirement without blocking further
 * uploads while one is in flight.
 */
export function UploadArea({ onUploadComplete }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inFlight, setInFlight] = useState<Record<string, InFlightUpload>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const localId = `${file.name}-${Date.now()}-${Math.random()}`;
        const validationError = validateFile(file);

        setInFlight((prev) => ({
          ...prev,
          [localId]: {
            localId,
            fileName: file.name,
            fileSizeBytes: file.size,
            progress: validationError ? 0 : 5,
            status: validationError ? "error" : "uploading",
            errorMessage: validationError ?? undefined,
          },
        }));

        if (validationError) {
          showToast({ title: "Upload failed", description: validationError, variant: "error" });
          return;
        }

        uploadDocument({
          file,
          onProgress: (percent) => {
            setInFlight((prev) => {
              const existing = prev[localId];
              if (!existing) return prev; // entry was removed by the user; drop the update
              return { ...prev, [localId]: { ...existing, progress: percent, status: "uploading" } };
            });
          },
        })
          .then((doc) => {
            if (doc.status === "complete") {
              setInFlight((prev) => {
                const existing = prev[localId];
                if (!existing) return prev;
                return { ...prev, [localId]: { ...existing, progress: 100, status: "complete" } };
              });
              showToast({
                title: "Upload complete",
                description: `${file.name} was added to decision context.`,
                variant: "success",
              });
              onUploadComplete(doc);
            } else {
              setInFlight((prev) => {
                const existing = prev[localId];
                if (!existing) return prev;
                return {
                  ...prev,
                  [localId]: { ...existing, status: "error", errorMessage: doc.errorMessage },
                };
              });
              showToast({
                title: "Upload failed",
                description: doc.errorMessage ?? "An unknown error occurred.",
                variant: "error",
              });
            }
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : "Upload failed unexpectedly.";
            setInFlight((prev) => {
              const existing = prev[localId];
              if (!existing) return prev;
              return { ...prev, [localId]: { ...existing, status: "error", errorMessage: message } };
            });
            showToast({ title: "Upload failed", description: message, variant: "error" });
          });
      });
    },
    [onUploadComplete, showToast]
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function removeEntry(localId: string) {
    setInFlight((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
  }

  const entries = Object.values(inFlight);

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          isDragging ? "border-primary bg-accent" : "border-border bg-muted/20 hover:border-primary/30"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <Upload className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="font-medium">Drag and drop documents here</p>
          <p className="text-sm text-muted-foreground">
            Supported format: PDF · Maximum file size per document is 25MB.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          Select Files from System
          <span aria-hidden="true">→</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
          aria-label="Choose files to upload"
        />
      </div>

      {entries.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Upload progress">
          {entries.map((entry) => (
            <li
              key={entry.localId}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(entry.fileSizeBytes)}</p>
                {entry.status === "uploading" && (
                  <div
                    className="mt-1.5 h-1.5 w-full rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={entry.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${entry.fileName}: ${entry.progress}%`}
                  >
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                )}
                {entry.status === "error" && (
                  <p className="mt-1 text-xs text-destructive">{entry.errorMessage}</p>
                )}
              </div>

              <div className="shrink-0">
                {entry.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Uploading" />
                )}
                {entry.status === "processing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Processing" />
                )}
                {entry.status === "complete" && (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-label="Upload complete" />
                )}
                {entry.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" aria-label="Upload failed" />
                )}
              </div>

              <button
                type="button"
                onClick={() => removeEntry(entry.localId)}
                aria-label={`Remove ${entry.fileName} from list`}
                className="shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
