import { Search, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { useQueryStore } from "@store/queryStore";
import type { QueryResult } from "@/types/api";
import { cn } from "@utils/cn";

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function groupLabel(date: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface QueryHistoryPanelProps {
  onSelect: (result: QueryResult) => void;
  activeQueryText?: string;
}

/**
 * Right-hand "Query History" rail on the Query page. Reads from the
 * existing queryStore (no new global state) and groups entries by
 * relative day, matching the Figma reference. Selecting a past entry
 * re-displays its already-fetched result instantly, with no refetch.
 */
export function QueryHistoryPanel({ onSelect, activeQueryText }: QueryHistoryPanelProps) {
  const history = useQueryStore((s) => s.queryHistory);
  const clearHistory = useQueryStore((s) => s.clearHistory);
  const [filter, setFilter] = useState("");

  const grouped = useMemo(() => {
    const filtered = filter.trim()
      ? history.filter((h) => h.queryText.toLowerCase().includes(filter.trim().toLowerCase()))
      : history;

    const groups = new Map<string, QueryResult[]>();
    for (const item of filtered) {
      const label = groupLabel(new Date(item.createdAt));
      const list = groups.get(label) ?? [];
      list.push(item);
      groups.set(label, list);
    }
    return Array.from(groups.entries());
  }, [history, filter]);

  return (
    <aside className="flex h-full flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <h2 className="text-sm font-semibold">Query History</h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="border-b border-border p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search history…"
            aria-label="Search query history"
            className="h-9 w-full rounded-md border border-input bg-muted/40 pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              Your past questions will appear here once you ask something.
            </p>
          </div>
        ) : (
          grouped.map(([label, items]) => (
            <div key={label} className="mb-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent",
                        activeQueryText === item.queryText && "bg-accent"
                      )}
                    >
                      <span className="truncate text-xs font-medium text-foreground">
                        {item.queryText}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTime(new Date(item.createdAt))}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
