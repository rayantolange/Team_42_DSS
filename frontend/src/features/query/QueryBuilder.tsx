import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Send,
  Paperclip,
  Mic,
  Building2,
  Database,
  MessageCircle,
} from "lucide-react";
import { useQueryStore } from "@store/queryStore";
import { Button } from "@components/ui/Button";
import { useAuth } from "@hooks/useAuth";
import { DEPARTMENTS } from "@services/index";
import { cn } from "@utils/cn";

interface QueryBuilderProps {
  onSubmit: (queryText: string, departmentId?: string) => void;
  isSubmitting: boolean;
  elevated?: boolean;
}

const EXAMPLE_QUERIES = [
  "Summarize FY24 enrollment trends",
  "Contrast research funding vs 2022",
  "Identify faculty retention risks",
  "Analyze regional competition",
];

/**
 * Natural-language query input, styled as a flat input bar that
 * grows upward as the user types multi-line text, with a fixed
 * icon row pinned to the bottom (layout inspired by common AI chat
 * products, using this app's own theme tokens for color). Department
 * heads are scoped to their own department automatically; admins can
 * optionally narrow the search to a specific department via the
 * inline selector.
 */
export function QueryBuilder({
  onSubmit,
  isSubmitting,
  elevated = false,
}: QueryBuilderProps) {
  const [queryText, setQueryText] = useState("");
  const { isAdmin, scopedDepartmentId } = useAuth();
  const [departmentId, setDepartmentId] = useState<string>(
    scopedDepartmentId ?? "all",
  );
  const mode = useQueryStore((s) => s.mode);
  const setMode = useQueryStore((s) => s.setMode);

  function submit() {
    if (!queryText.trim() || isSubmitting) return;
    const dept = isAdmin
      ? departmentId === "all"
        ? undefined
        : departmentId
      : (scopedDepartmentId ?? undefined);
    onSubmit(queryText.trim(), dept);
    setQueryText("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            mode === "search"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
          Search Database
        </button>
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            mode === "chat"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Continue Chatting
        </button>
      </div>
      <label htmlFor="query-input" className="sr-only">
        Ask a question about institutional policies or decisions
      </label>
      <div className="flex items-end gap-2 rounded-3xl border border-border bg-card px-2 py-[9px]">
        <button
          type="button"
          disabled
          title="Attachments — coming soon"
          className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full text-muted-foreground/50 cursor-not-allowed"
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
        </button>
        <textarea
          id="query-input"
          rows={1}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "chat"
              ? "Ask a follow-up about the results above…"
              : "Ask about institutional data, reports, or trends…"
          }
          className="max-h-[max(30svh,5rem)] min-h-9 flex-1 resize-none self-center border-0 bg-transparent px-1 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        {isAdmin && (
          <div className="hidden shrink-0 items-center gap-1.5 self-end rounded-full border border-border/60 px-2 py-1 sm:flex">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              aria-label="Limit search to department"
              className="bg-transparent text-xs font-medium focus:outline-none"
            >
              <option value="all">All</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          disabled
          title="Voice input — coming soon"
          className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full text-muted-foreground/50 cursor-not-allowed"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
        </button>
        <Button
          type="submit"
          size="icon"
          isLoading={isSubmitting}
          disabled={!queryText.trim()}
          aria-label="Send query"
          className="h-9 w-9 shrink-0 self-end rounded-full"
        >
          {!isSubmitting && <Send className="h-3.5 w-3.5" aria-hidden="true" />}
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQueryText(example)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              elevated
                ? "glass-chip text-white/90 hover:bg-white/[0.16]"
                : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}