import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send, Paperclip, Mic, Building2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useAuth } from "@hooks/useAuth";
import { DEPARTMENTS } from "@services/index";
import { cn } from "@utils/cn";

interface QueryBuilderProps {
  onSubmit: (queryText: string, departmentId?: string) => void;
  isSubmitting: boolean;
  /** Renders as a floating white card with a glowing round send button — used on the gradient hero panel. */
  elevated?: boolean;
}

const EXAMPLE_QUERIES = [
  "Summarize FY24 enrollment trends",
  "Contrast research funding vs 2022",
  "Identify faculty retention risks",
  "Analyze regional competition",
];

/**
 * Natural-language query input, styled as a single elevated
 * "command box" (matching the Figma Query screen) rather than a
 * plain form row. Department heads are scoped to their own
 * department automatically; admins can optionally narrow the search
 * to a specific department via the inline selector.
 */
export function QueryBuilder({ onSubmit, isSubmitting, elevated = false }: QueryBuilderProps) {
  const [queryText, setQueryText] = useState("");
  const { isAdmin, scopedDepartmentId } = useAuth();
  const [departmentId, setDepartmentId] = useState<string>(scopedDepartmentId ?? "all");

  function submit() {
    if (!queryText.trim() || isSubmitting) return;
    const dept = isAdmin ? (departmentId === "all" ? undefined : departmentId) : scopedDepartmentId ?? undefined;
    onSubmit(queryText.trim(), dept);
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
      <label htmlFor="query-input" className="sr-only">
        Ask a question about institutional policies or decisions
      </label>

      <div
        className={cn(
          "rounded-2xl border border-border bg-card p-3 transition-shadow focus-within:ring-2 focus-within:ring-ring",
          elevated ? "shadow-popover focus-within:shadow-glow" : "shadow-card focus-within:shadow-card-hover"
        )}
      >
        <textarea
          id="query-input"
          rows={2}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about institutional data, reports, or trends…"
          className="w-full resize-none border-0 bg-transparent px-1.5 py-1 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title="Attachments — coming soon"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 cursor-not-allowed"
            >
              <Paperclip className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled
              title="Voice input — coming soon"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 cursor-not-allowed"
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
            </button>

            {isAdmin && (
              <div className="ml-1 flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  aria-label="Limit search to department"
                  className="bg-transparent text-xs font-medium focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {elevated ? (
            <Button
              type="submit"
              size="icon"
              isLoading={isSubmitting}
              disabled={!queryText.trim()}
              aria-label="Send query"
              className="h-9 w-9 rounded-full"
            >
              {!isSubmitting && <Send className="h-4 w-4" aria-hidden="true" />}
            </Button>
          ) : (
            <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!queryText.trim()}>
              {isSubmitting ? "Searching…" : "Send Query"}
              {!isSubmitting && <Send className="h-3.5 w-3.5" aria-hidden="true" />}
            </Button>
          )}
        </div>
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
                : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}
