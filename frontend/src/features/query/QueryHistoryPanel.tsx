import { useState, useMemo } from "react";
import {
  Search,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquareText,
  SquarePen,
  Trash2,
} from "lucide-react";
import { useQueryStore, type ChatConversation } from "@store/queryStore";
import { Button } from "@components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@components/ui/Dialog";
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

export function QueryHistoryPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState("");
  const [conversationToDelete, setConversationToDelete] =
    useState<ChatConversation | null>(null);

  const conversations = useQueryStore((s) => s.conversations);
  const activeConversationId = useQueryStore((s) => s.activeConversationId);
  const selectConversation = useQueryStore((s) => s.selectConversation);
  const startNewConversation = useQueryStore((s) => s.startNewConversation);
  const deleteConversation = useQueryStore((s) => s.deleteConversation);

  const grouped = useMemo(() => {
    const sorted = [...conversations].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const filtered = filter.trim()
      ? sorted.filter((c) =>
          c.title.toLowerCase().includes(filter.trim().toLowerCase()),
        )
      : sorted;
    const groups = new Map<string, ChatConversation[]>();
    for (const item of filtered) {
      const label = groupLabel(new Date(item.updatedAt));
      const list = groups.get(label) ?? [];
      list.push(item);
      groups.set(label, list);
    }
    return Array.from(groups.entries());
  }, [conversations, filter]);

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
              Chat History
            </h2>
          )}
        </div>
      </div>

      {/* New Chat */}
      {!isCollapsed && (
        <div className="w-full px-2 pb-2">
          <button
            type="button"
            onClick={startNewConversation}
            title="New chat"
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-[#282a2d]"
          >
            <SquarePen className="h-4 w-4 shrink-0" aria-hidden="true" />
            New chat
          </button>
        </div>
      )}

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
              placeholder="Search chats…"
              aria-label="Search chat history"
              className="h-9 w-full rounded-full border-none bg-[#131314]/80 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>
      )}

      {/* History Items Container — entirely hidden when collapsed */}
      {!isCollapsed && (
        <div className="scrollbar-thin flex-1 w-full overflow-y-auto overflow-x-hidden px-1 py-2">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
              <Clock className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <p className="text-xs text-slate-400">
                Your past conversations will appear here once you ask something.
              </p>
            </div>
          ) : (
            grouped.map(([label, items]) => (
              <div key={label} className="mb-4">
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {label}
                </p>
                <ul className="flex flex-col gap-1 items-center">
                  {items.map((item) => {
                    const isActive = activeConversationId === item.id;
                    return (
                      <li key={item.id} className="w-full flex justify-center">
                        <div
                          className={cn(
                            "group flex w-full items-center rounded-xl transition-all",
                            isActive
                              ? "bg-[#282a2d] text-white shadow-sm"
                              : "text-slate-300 hover:bg-[#282a2d]/60 hover:text-slate-100",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectConversation(item.id)}
                            className="flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5 text-left"
                          >
                            <MessageSquareText
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-sky-400" : "text-slate-400",
                              )}
                            />
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="truncate text-xs font-medium">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatTime(new Date(item.updatedAt))}
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(item);
                            }}
                            aria-label={`Delete "${item.title}"`}
                            className="mr-2 shrink-0 rounded-full p-1.5 text-slate-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-rose-400 group-hover:opacity-100"
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={conversationToDelete !== null}
        onOpenChange={(open) => !open && setConversationToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>
              {conversationToDelete && (
                <>
                  This will permanently delete{" "}
                  <strong>"{conversationToDelete.title}"</strong> and all of its
                  messages. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation(conversationToDelete.id);
                }
                setConversationToDelete(null);
              }}
            >
              Delete Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
