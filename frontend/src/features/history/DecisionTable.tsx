import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@components/ui/Table";
import { Badge } from "@components/ui/Badge";
import { Skeleton } from "@components/ui/Skeleton";
import type { DecisionRecordSummary, DecisionRecordStatus } from "@/types/domain";

const STATUS_BADGE: Record<DecisionRecordStatus, "success" | "destructive" | "secondary" | "outline"> = {
  draft: "outline",
  approved: "secondary",
  implemented: "secondary",
  completed: "success",
  cancelled: "destructive",
};

interface DecisionTableProps {
  decisions: DecisionRecordSummary[];
  isLoading: boolean;
  onSelectDecision: (decision: DecisionRecordSummary) => void;
}

export function DecisionTable({ decisions, isLoading, onSelectDecision }: DecisionTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-busy="true">
        <span className="sr-only">Loading decisions...</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No decisions match the current filters. Try adjusting your search or status.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Decision</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {decisions.map((decision) => (
          <TableRow
            key={decision.decisionId}
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
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {decision.decisionType ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_BADGE[decision.status]} className="capitalize">
                {decision.status}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {decision.decisionDate
                ? new Date(decision.decisionDate).toLocaleDateString()
                : new Date(decision.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}