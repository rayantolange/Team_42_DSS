import { FileText, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { Skeleton } from "@components/ui/Skeleton";
import type { UploadedDocument } from "@/types/domain";

interface DocumentsListProps {
  documents: UploadedDocument[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CONFIG: Record<
  UploadedDocument["status"],
  { label: string; variant: "soft" | "soft-success" | "soft-destructive"; dot: string }
> = {
  uploading: { label: "Uploading", variant: "soft", dot: "bg-primary" },
  processing: { label: "Indexing", variant: "soft", dot: "bg-primary" },
  complete: { label: "Completed", variant: "soft-success", dot: "bg-success" },
  error: { label: "Failed", variant: "soft-destructive", dot: "bg-destructive" },
};

export function DocumentsList({ documents, isLoading, onDelete }: DocumentsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4" role="status" aria-busy="true">
        <span className="sr-only">Loading documents…</span>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No documents have been uploaded yet. Upload a PDF above to provide decision context.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-semibold">
              Document Name
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Size
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Timeline
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {documents.map((doc) => {
            const status = STATUS_CONFIG[doc.status];
            return (
              <tr key={doc.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate font-medium">{doc.fileName}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatBytes(doc.fileSizeBytes)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={status.variant} className="gap-1.5 font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                    {status.label}
                  </Badge>
                  {doc.status === "error" && doc.errorMessage && (
                    <p className="mt-1 max-w-[220px] text-xs text-destructive">{doc.errorMessage}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  ,{" "}
                  {new Date(doc.uploadedAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(doc.id)}
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
