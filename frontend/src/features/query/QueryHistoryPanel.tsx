import { useState, useMemo } from "react";
import {
  Search,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquareText,
} from "lucide-react";
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
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface QueryHistoryPanelProps {
  onSelect: (result: QueryResult) => void;
  activeQueryText?: string;
}

export function QueryHistoryPanel({
  onSelect,
  activeQueryText,
}: QueryHistoryPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState("");

  const history = useQueryStore((s) => s.queryHistory);
  const clearHistory = useQueryStore((s) => s.clearHistory);

  const grouped = useMemo(() => {
    const filtered = filter.trim()
      ? history.filter((h) =>
          h.queryText.toLowerCase().includes(filter.trim().toLowerCase()),
        )
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
    <aside
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out select-none",
        isCollapsed
          ? "w-12 items-center"
          : "w-72 rounded-2xl bg-[#1e1f20]/60 p-2",
      )}
    >
      {/* Header & Toggle */}
      <div
        className={cn(
          "flex items-center w-full py-2",
          isCollapsed ? "justify-center" : "justify-between px-2",
        )}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-[#282a2d] hover:text-slate-100 transition-colors"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-slate-200 whitespace-nowrap">
              Query History
            </h2>
          )}
        </div>

        {!isCollapsed && history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Input Box */}
      {!isCollapsed && (
        <div className="px-2 pb-2 w-full">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search history…"
              aria-label="Search query history"
              className="h-9 w-full rounded-full border-none bg-[#131314]/80 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>
      )}

      {/* History Items Container */}
      <div className="scrollbar-thin flex-1 w-full overflow-y-auto overflow-x-hidden px-1 py-2">
        {grouped.length === 0
          ? /* Only show empty state illustration when expanded */
            !isCollapsed && (
              <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                <Clock className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="text-xs text-slate-400">
                  Your past questions will appear here once you ask something.
                </p>
              </div>
            )
          : grouped.map(([label, items]) => (
              <div key={label} className="mb-4">
                {!isCollapsed && (
                  <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {label}
                  </p>
                )}
                <ul className="flex flex-col gap-1 items-center">
                  {items.map((item) => {
                    const isActive = activeQueryText === item.queryText;
                    return (
                      <li key={item.id} className="w-full flex justify-center">
                        <button
                          type="button"
                          onClick={() => onSelect(item)}
                          title={isCollapsed ? item.queryText : undefined}
                          className={cn(
                            "flex items-center rounded-xl transition-all",
                            isCollapsed
                              ? "h-9 w-9 justify-center p-0 rounded-full"
                              : "w-full gap-3 px-3 py-2.5 text-left",
                            isActive
                              ? "bg-[#282a2d] text-white shadow-sm"
                              : "text-slate-300 hover:bg-[#282a2d]/60 hover:text-slate-100",
                          )}
                        >
                          <MessageSquareText
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-sky-400" : "text-slate-400",
                            )}
                          />

                          {!isCollapsed && (
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="truncate text-xs font-medium">
                                {item.queryText}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatTime(new Date(item.createdAt))}
                              </span>
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
      </div>
    </aside>
  );
}
