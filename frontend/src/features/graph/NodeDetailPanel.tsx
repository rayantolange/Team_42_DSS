import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { useDecision } from "@features/decisions/useDecisions";
import type { GraphNodeData } from "@features/graph/useGraphData";

interface NodeDetailPanelProps {
  node: { data: GraphNodeData } | null;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, "success" | "destructive" | "secondary" | "outline"> = {
  draft: "outline",
  approved: "secondary",
  implemented: "secondary",
  completed: "success",
  cancelled: "destructive",
  successful: "success",
  partially_successful: "secondary",
  failed: "destructive",
};

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  if (!node) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        Select a node in the graph to see its details here.
      </div>
    );
  }

  const { data } = node;

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {data.entityType}
          </p>
          <h2 className="text-base font-semibold capitalize leading-tight">{data.label}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail panel">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {data.entityType === "decision" && <DecisionDetail entityId={data.entityId} />}
        {data.entityType === "strategy" && (
          <p className="text-sm text-muted-foreground">
            This strategy is applied across one or more decisions. Select a connected decision
            node for full context.
          </p>
        )}
        {data.entityType === "constraint" && (
          <p className="text-sm text-muted-foreground">
            This constraint limits one or more decisions. Select a connected decision node for
            full context.
          </p>
        )}
        {data.entityType === "outcome" && data.status && (
          <div className="text-sm">
            <p className="font-medium">Status</p>
            <Badge variant={STATUS_BADGE[data.status] ?? "secondary"} className="mt-1 capitalize">
              {data.status.replace(/_/g, " ")}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionDetail({ entityId }: { entityId: string }) {
  const { data: decision, isLoading } = useDecision(Number(entityId));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!decision) return null;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="font-medium">Status</p>
        <Badge variant={STATUS_BADGE[decision.status] ?? "secondary"} className="mt-1 capitalize">
          {decision.status}
        </Badge>
      </div>
      {decision.decisionType && (
        <div>
          <p className="font-medium">Type</p>
          <p className="text-muted-foreground">{decision.decisionType}</p>
        </div>
      )}
      <div>
        <p className="font-medium">Problem Statement</p>
        <p className="text-muted-foreground">{decision.problemStatement}</p>
      </div>
      <div>
        <p className="font-medium">Description</p>
        <p className="text-muted-foreground">{decision.decisionDesc}</p>
      </div>
      <Link
        to={`/decisions/${decision.decisionId}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        Open full decision details →
      </Link>
    </div>
  );
}