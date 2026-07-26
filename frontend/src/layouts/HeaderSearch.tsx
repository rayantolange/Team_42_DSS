import { useMemo, useState, type FormEvent } from "react";
import { Search, ArrowUpRight, Clock } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { useQueryStore } from "@store/queryStore";
import { cn } from "@utils/cn";
import { useNavigate } from "react-router-dom";

interface Suggestion {
  id: string;
  label: string;
  meta: string;
  icon: typeof Search;
  onSelect: () => void;
}

/**
 * Global header search. There's no unified search index behind this
 * yet, so "live suggestions" are composed client-side from two real
 * sources already in the app: sidebar destinations (by label) and
 * past conversations (from queryStore) — no fabricated results.
 * Pressing Enter with no exact suggestion match falls back to sending
 * the raw text to the Query page, same as before.
 */
export function HeaderSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const conversations = useQueryStore((s) => s.conversations);
  const selectConversation = useQueryStore((s) => s.selectConversation);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = term.trim().toLowerCase();

    const sorted = [...conversations].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    if (!q) {
      // Empty state: surface the 3 most recent conversations as "recent searches".
      return sorted.slice(0, 3).map((c) => ({
        id: c.id,
        label: c.title,
        meta: "Recent chat",
        icon: Clock,
        onSelect: () => {
          selectConversation(c.id);
          navigate("/query");
        },
      }));
    }

    const navMatches: Suggestion[] = NAV_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(q),
    ).map((item) => ({
      id: item.to,
      label: item.label,
      meta: "Go to page",
      icon: ArrowUpRight,
      onSelect: () => navigate(item.to),
    }));

    const conversationMatches: Suggestion[] = sorted
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        label: c.title,
        meta: "From your chat history",
        icon: Clock,
        onSelect: () => {
          selectConversation(c.id);
          navigate("/query");
        },
      }));

    return [...navMatches, ...conversationMatches].slice(0, 6);
  }, [term, conversations, navigate, selectConversation]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    if (suggestions[0]) {
      suggestions[0].onSelect();
    } else {
      navigate("/query", { state: { prefillQuery: term.trim() } });
    }
    setTerm("");
    setIsFocused(false);
  }

  const showPanel =
    isFocused && (term.trim().length > 0 || conversations.length > 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative hidden max-w-md flex-1 sm:block"
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 120)}
        placeholder="Quick search across intelligence…"
        aria-label="Quick search across intelligence"
        className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div
        className={cn(
          "absolute left-0 top-full z-40 mt-2 w-full origin-top rounded-xl border border-border bg-popover text-popover-foreground shadow-popover transition-all duration-150",
          showPanel
            ? "visible scale-100 opacity-100"
            : "invisible scale-95 opacity-0",
        )}
      >
        {suggestions.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            No matches yet — press Enter to ask Nirnaya directly.
          </p>
        ) : (
          <ul className="py-1.5">
            {!term.trim() && (
              <li className="px-3.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recent chats
              </li>
            )}
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    s.onSelect();
                    setTerm("");
                    setIsFocused(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-accent"
                >
                  <s.icon
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {s.label}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {s.meta}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
