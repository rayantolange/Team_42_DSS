import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import type { RecentDecision } from "@services/dashboardService";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: "soft-success" | "soft-destructive" | "soft" | "soft-warning" }
> = {
  draft: { label: "Draft", dot: "bg-muted-foreground", badge: "soft" },
  approved: { label: "Approved", dot: "bg-primary", badge: "soft" },
  implemented: { label: "Implemented", dot: "bg-success", badge: "soft-success" },
  completed: { label: "Completed", dot: "bg-success", badge: "soft-success" },
  cancelled: { label: "Cancelled", dot: "bg-destructive", badge: "soft-destructive" },
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface RecentDecisionsListProps {
  decisions: RecentDecision[];
}

export function RecentDecisionsList({ decisions }: RecentDecisionsListProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest institutional decisions across departments</CardDescription>
        </div>
        <Link to="/history" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {decisions.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">No recent decisions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-t border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2.5 font-semibold">Decision ID</th>
                  <th className="px-4 py-2.5 font-semibold">Source Entity</th>
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {decisions.map((decision, i) => {
                  const status = STATUS_CONFIG[decision.status] ?? STATUS_CONFIG.draft;
                  return (
                    <tr
                      key={decision.decisionId}
                      className="animate-fade-in border-l-2 border-l-transparent transition-colors hover:border-l-primary hover:bg-muted/40"
                      style={{ animationDelay: `${i * 45}ms`, animationFillMode: "backwards" }}
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-muted-foreground">
                        #{decision.decisionId}
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <p className="truncate font-medium">{decision.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{decision.departmentName}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatRelativeTime(decision.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={status.badge} className="gap-1.5 font-medium">
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/decisions/${decision.decisionId}`}
                          aria-label={`View ${decision.title}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}