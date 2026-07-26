import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@utils/cn";
import { Link } from "react-router-dom";
import type { QuerySource } from "@/types/api";

interface SourceCardProps {
  source: QuerySource;
  index: number;
}

function SourceCard({ source, index }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const relevancePercent = Math.round(source.relevanceScore * 100);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`source-content-${source.id}`}
        className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-sm font-medium">
            [{index + 1}] {source.title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{relevancePercent}% match</span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </div>
      </button>
      {expanded && (
        <div id={`source-content-${source.id}`} className="border-t border-border p-3 text-sm text-muted-foreground">
          <p>{source.snippet}</p>
          {source.policyId && (
            <Link
              to={`/graph?nodeId=${source.policyId}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              View in Knowledge Graph →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

interface SourceListProps {
  sources: QuerySource[];
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No supporting sources were found for this question.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Sources ({sources.length})</h3>
      {sources.map((source, idx) => (
        <SourceCard key={source.id} source={source} index={idx} />
      ))}
    </div>
  );
}
