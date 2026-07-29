import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  FileCheck2,
  GitCommitVertical,
  Flag,
  CheckCheck,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@components/ui/Popover";
import {
  useNotifications,
  type AppNotification,
} from "@features/notifications/useNotifications";
import { cn } from "@utils/cn";
import { loadNotificationPrefs } from "@pages/SettingsPage";

const KIND_ICON: Record<AppNotification["kind"], typeof Bell> = {
  decision: GitCommitVertical,
  document: FileCheck2,
  outcome: Flag,
};

const KIND_TINT: Record<AppNotification["kind"], string> = {
  decision: "bg-primary/10 text-primary",
  document: "bg-success/10 text-success",
  outcome: "bg-warning/10 text-warning",
};

function formatRelativeTime(iso: string): string {
  const minutesAgo = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const READ_STORAGE_KEY = "nirnaya-notifications-read-ids";
const CLEARED_STORAGE_KEY = "nirnaya-notifications-cleared-ids";

function loadIdSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Header notification bell + popover panel, sourced from real recent
 * activity (decisions, documents, outcomes) rather than a mock feed.
 * Respects the user's notification preferences from Settings.
 * Read/unread and cleared state are tracked locally per-browser since
 * there's no backend notifications table to persist them against.
 */
export function NotificationPanel() {
  const { notifications, isLoading } = useNotifications();
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    loadIdSet(READ_STORAGE_KEY),
  );
  const [clearedIds, setClearedIds] = useState<Set<string>>(() =>
    loadIdSet(CLEARED_STORAGE_KEY),
  );

  useEffect(() => {
    window.localStorage.setItem(
      READ_STORAGE_KEY,
      JSON.stringify(Array.from(readIds)),
    );
  }, [readIds]);

  useEffect(() => {
    window.localStorage.setItem(
      CLEARED_STORAGE_KEY,
      JSON.stringify(Array.from(clearedIds)),
    );
  }, [clearedIds]);

  const prefs = loadNotificationPrefs();

  const prefsFilteredNotifications = notifications.filter((n) => {
    if (n.kind === "decision") return prefs.decisions;
    if (n.kind === "document") return prefs.documents;
    if (n.kind === "outcome") return prefs.outcomes;
    return true;
  });

  const visibleNotifications = prefsFilteredNotifications.filter(
    (n) => !clearedIds.has(n.id),
  );
  const unreadCount = visibleNotifications.filter(
    (n) => !readIds.has(n.id),
  ).length;

  function markAllRead() {
    setReadIds(new Set(visibleNotifications.map((n) => n.id)));
  }

  function markRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
  }

  function clearAll() {
    setClearedIds(new Set(prefsFilteredNotifications.map((n) => n.id)));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all as read
              </button>
            )}
            {visibleNotifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>
        <ul className="scrollbar-thin max-h-96 overflow-y-auto">
          {isLoading ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading...
            </li>
          ) : visibleNotifications.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No recent activity yet.
            </li>
          ) : (
            visibleNotifications.map((n) => {
              const Icon = KIND_ICON[n.kind];
              const isRead = readIds.has(n.id);
              return (
                <li key={n.id}>
                  <Link
                    to={`/decisions/${n.decisionId}`}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50",
                      !isRead && "bg-accent/40",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        KIND_TINT[n.kind],
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">
                          {n.title}
                        </p>
                        {!isRead && (
                          <span
                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
                        {n.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}