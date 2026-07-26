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
import { useDecisionPolicyContext } from "@features/history/useDecisionHistory";
import { getDepartmentById } from "@services/index";
import type { OutcomeSentiment } from "@/types/domain";

const SENTIMENT_BADGE: Record<OutcomeSentiment, "success" | "destructive" | "secondary"> = {
  positive: "success",
  negative: "destructive",
  neutral: "secondary",
};

interface DecisionDetailModalProps {
  decisionId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function DecisionDetailModal({ decisionId, onOpenChange }: DecisionDetailModalProps) {
  const { data, isLoading } = useDecisionPolicyContext(decisionId);

  return (
    <Dialog open={Boolean(decisionId)} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="decision-detail-description">
        {isLoading || !data ? (
          <div className="flex flex-col gap-3" role="status" aria-busy="true">
            <span className="sr-only">Loading decision details…</span>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{data.decision.title}</DialogTitle>
              <DialogDescription id="decision-detail-description">
                {getDepartmentById(data.decision.departmentId)?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={SENTIMENT_BADGE[data.decision.outcomeSentiment]} className="capitalize">
                  {data.decision.status.replace(/_/g, " ")}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(data.decision.dateCreated).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div>
                <p className="font-medium">Outcome</p>
                <p className="text-muted-foreground">{data.decision.summary}</p>
              </div>

              {data.policy && (
                <>
                  <div>
                    <p className="font-medium">Based on Policy</p>
                    <p className="text-muted-foreground">
                      {data.policy.title} ({data.policy.id})
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Decision Context</p>
                    <p className="text-muted-foreground">{data.policy.decisionContext}</p>
                  </div>
                  <div>
                    <p className="font-medium">Legal / Regulatory Basis</p>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {data.policy.legalBasis.map((basis) => (
                        <li key={basis}>{basis}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to={`/graph?nodeId=${data.policy.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View this policy in the Knowledge Graph →
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
