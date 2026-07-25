import { useState } from "react";
import { Bell, FileCheck2, GitCommitVertical, ShieldAlert, CheckCheck } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@components/ui/Popover";
import { cn } from "@utils/cn";

interface Notification {
  id: string;
  icon: typeof Bell;
  iconTint: string;
  title: string;
  description: string;
  minutesAgo: number;
  read: boolean;
}

// Realistic, product-relevant sample notifications (document ingestion,
// decision logging, policy conflicts) rather than generic placeholder
// copy — there's no backend to source these from, but the content
// mirrors exactly what this system's mocked domain events would be.
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    icon: FileCheck2,
    iconTint: "bg-success/10 text-success",
    title: "Document indexing complete",
    description: "FY24_Institutional_Policy.pdf is now searchable in Query and Graph Explorer.",
    minutesAgo: 12,
    read: false,
  },
  {
    id: "n2",
    icon: GitCommitVertical,
    iconTint: "bg-primary/10 text-primary",
    title: "New decision logged",
    description: "Registrar's Office recorded a decision on Fall enrollment caps.",
    minutesAgo: 47,
    read: false,
  },
  {
    id: "n3",
    icon: ShieldAlert,
    iconTint: "bg-warning/10 text-warning",
    title: "Possible policy conflict detected",
    description: "A newly uploaded document may conflict with Financial Aid Policy v2.3.",
    minutesAgo: 130,
    read: true,
  },
  {
    id: "n4",
    icon: FileCheck2,
    iconTint: "bg-success/10 text-success",
    title: "Weekly digest ready",
    description: "12 decisions and 4 documents were added across all departments this week.",
    minutesAgo: 1440,
    read: true,
  },
];

function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Header notification bell + animated popover panel. State is local
 * (no backend for notifications yet), seeded with realistic sample
 * events so the interaction — badge count, opening, marking read —
 * behaves like the real feature will once wired to a live feed.
 */
export function NotificationPanel() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
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
        </div>

        <ul className="scrollbar-thin max-h-96 overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50",
                  !n.read && "bg-accent/40"
                )}
              >
                <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", n.iconTint)}>
                  <n.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{n.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatRelativeTime(n.minutesAgo)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
