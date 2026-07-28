import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/Dialog";
import { Badge } from "@components/ui/Badge";
import { Skeleton } from "@components/ui/Skeleton";
import { useDecisionDetail } from "@features/history/useDecisionHistory";
import type { DecisionRecordStatus } from "@/types/domain";

const STATUS_BADGE: Record<DecisionRecordStatus, "success" | "destructive" | "secondary" | "outline"> = {
  draft: "outline",
  approved: "secondary",
  implemented: "secondary",
  completed: "success",
  cancelled: "destructive",
};

interface DecisionDetailModalProps {
  decisionId: number | null;
  onOpenChange: (open: boolean) => void;
}

export function DecisionDetailModal({ decisionId, onOpenChange }: DecisionDetailModalProps) {
  const { data: decision, isLoading } = useDecisionDetail(decisionId);

  return (
    <Dialog open={decisionId !== null} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="decision-detail-description">
        {isLoading || !decision ? (
          <div className="flex flex-col gap-3" role="status" aria-busy="true">
            <span className="sr-only">Loading decision details...</span>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{decision.title}</DialogTitle>
              <DialogDescription id="decision-detail-description">
                {decision.decisionType ?? "Decision"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_BADGE[decision.status]} className="capitalize">
                  {decision.status}
                </Badge>
                {decision.decisionDate && (
                  <span className="text-muted-foreground">
                    {new Date(decision.decisionDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">Problem Statement</p>
                <p className="text-muted-foreground">{decision.problemStatement}</p>
              </div>
              <div>
                <p className="font-medium">Decision Description</p>
                <p className="text-muted-foreground">{decision.decisionDesc}</p>
              </div>
              <Link
                to={`/decisions/${decision.decisionId}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open full decision details →
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}