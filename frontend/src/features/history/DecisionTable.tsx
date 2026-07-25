import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@components/ui/Table";
import { Badge } from "@components/ui/Badge";
import { Skeleton } from "@components/ui/Skeleton";
import { getDepartmentById } from "@services/index";
import type { Decision, OutcomeSentiment } from "@/types/domain";

const SENTIMENT_BADGE: Record<OutcomeSentiment, "success" | "destructive" | "secondary"> = {
  positive: "success",
  negative: "destructive",
  neutral: "secondary",
};

interface DecisionTableProps {
  decisions: Decision[];
  isLoading: boolean;
  onSelectDecision: (decision: Decision) => void;
}

export function DecisionTable({ decisions, isLoading, onSelectDecision }: DecisionTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-busy="true">
        <span className="sr-only">Loading decisions…</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No decisions match the current filters. Try adjusting your search or date range.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Decision</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {decisions.map((decision) => {
          const dept = getDepartmentById(decision.departmentId);
          return (
            <TableRow
              key={decision.id}
              tabIndex={0}
              onClick={() => onSelectDecision(decision)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDecision(decision);
                }
              }}
              aria-label={`View details for ${decision.title}`}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TableCell className="max-w-md">
                <p className="truncate font-medium">{decision.title}</p>
                <p className="truncate text-xs text-muted-foreground">{decision.summary}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {dept?.name ?? decision.departmentId}
              </TableCell>
              <TableCell>
                <Badge variant={SENTIMENT_BADGE[decision.outcomeSentiment]} className="capitalize">
                  {decision.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {new Date(decision.dateCreated).toLocaleDateString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
