import { X } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { getPolicyById, getDepartmentById, getDecisionById, getDecisionsByPolicy } from "@services/index";
import type { GraphNodeData, OutcomeSentiment } from "@/types/domain";

const SENTIMENT_BADGE: Record<OutcomeSentiment, "success" | "destructive" | "secondary"> = {
  positive: "success",
  negative: "destructive",
  neutral: "secondary",
};

interface NodeDetailPanelProps {
  node: { data: GraphNodeData } | null;
  onClose: () => void;
}

/**
 * Side panel showing entity information, related decisions, and
 * connected entities for the currently selected graph node. Content
 * varies by entity type since a Department, Policy, Decision, and
 * Outcome each have different relevant detail.
 */
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
          <p className="text-xs uppercase tracking-wide text-muted-foreground capitalize">
            {data.entityType}
          </p>
          <h2 className="text-base font-semibold leading-tight">{data.label}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {data.entityType === "department" && <DepartmentDetail entityId={data.entityId} />}
        {data.entityType === "policy" && <PolicyDetail entityId={data.entityId} />}
        {data.entityType === "decision" && <DecisionDetail entityId={data.entityId} />}
        {data.entityType === "outcome" && (
          <p className="text-sm text-muted-foreground">
            This outcome resulted from a specific decision. Select the connected decision node for
            full context.
          </p>
        )}
        {data.entityType === "regulation" && (
          <p className="text-sm text-muted-foreground">
            This is a legal or regulatory reference cited by one or more institutional policies.
          </p>
        )}
      </div>
    </div>
  );
}

function DepartmentDetail({ entityId }: { entityId: string }) {
  const dept = getDepartmentById(entityId);
  if (!dept) return null;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted-foreground">{dept.description}</p>
      <div>
        <p className="font-medium">Type</p>
        <p className="text-muted-foreground">{dept.type}</p>
      </div>
      <div>
        <p className="font-medium">Policies</p>
        <p className="text-muted-foreground">{dept.policyCount} active policies</p>
      </div>
      <div>
        <p className="font-medium">Key Regulations</p>
        <ul className="list-inside list-disc text-muted-foreground">
          {dept.keyRegulations.map((reg) => (
            <li key={reg}>{reg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PolicyDetail({ entityId }: { entityId: string }) {
  const policy = getPolicyById(entityId);
  if (!policy) return null;
  const dept = getDepartmentById(policy.departmentId);
  const relatedDecisions = getDecisionsByPolicy(policy.id).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="font-medium">Department</p>
        <p className="text-muted-foreground">{dept?.name}</p>
      </div>
      <div>
        <p className="font-medium">Description</p>
        <p className="text-muted-foreground">{policy.description}</p>
      </div>
      <div>
        <p className="font-medium">Decision Context</p>
        <p className="text-muted-foreground">{policy.decisionContext}</p>
      </div>
      <div>
        <p className="font-medium">Constraints</p>
        <ul className="list-inside list-disc text-muted-foreground">
          {policy.constraints.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium">Connected Entities</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {policy.relatedEntities.map((entity) => (
            <Badge key={entity} variant="outline">
              {entity}
            </Badge>
          ))}
        </div>
      </div>
      {relatedDecisions.length > 0 && (
        <div>
          <p className="font-medium">Related Decisions</p>
          <ul className="mt-1 flex flex-col gap-1">
            {relatedDecisions.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-muted-foreground">{d.outcomeLabel}</span>
                <Badge variant={SENTIMENT_BADGE[d.outcomeSentiment]} className="shrink-0">
                  {d.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DecisionDetail({ entityId }: { entityId: string }) {
  const decision = getDecisionById(entityId);
  if (!decision) return null;
  const policy = getPolicyById(decision.policyId);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="font-medium">Based on Policy</p>
        <p className="text-muted-foreground">{policy?.title}</p>
      </div>
      <div>
        <p className="font-medium">Summary</p>
        <p className="text-muted-foreground">{decision.summary}</p>
      </div>
      <div>
        <p className="font-medium">Status</p>
        <Badge variant={SENTIMENT_BADGE[decision.outcomeSentiment]} className="mt-1 capitalize">
          {decision.status.replace(/_/g, " ")}
        </Badge>
      </div>
      <div>
        <p className="font-medium">Date</p>
        <p className="text-muted-foreground">
          {new Date(decision.dateCreated).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
