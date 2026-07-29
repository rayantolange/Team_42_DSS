// src/features/graph/graphDataBuilder.ts
import type { Node, Edge } from "reactflow";
import type { RawGraphData, GraphNodeData } from "./useGraphData";

export type DSSNode = Node<GraphNodeData>;
export type DSSEdge = Edge<{ relationship: string }>;

const COLUMN_X = {
  strategy: -320,
  decision: 0,
  constraint: 320,
  outcome: 640,
};

const ROW_HEIGHT = 90;

export function buildGraphData(data: RawGraphData): { nodes: DSSNode[]; edges: DSSEdge[] } {
  const nodes: DSSNode[] = [];
  const edges: DSSEdge[] = [];

  const strategyYById = new Map<string, number>();
  const constraintYById = new Map<string, number>();
  let strategyCursor = 0;
  let constraintCursor = 0;

  data.decisions.forEach((decision, i) => {
    const decisionNodeId = `decision-${decision.decisionId}`;
    const decisionY = i * ROW_HEIGHT;

    nodes.push({
      id: decisionNodeId,
      type: "default",
      position: { x: COLUMN_X.decision, y: decisionY },
      data: {
        entityType: "decision",
        label: decision.title,
        entityId: String(decision.decisionId),
        subtitle: decision.decisionType,
        status: decision.status,
      },
    });

    const links = data.linksByDecision[decision.decisionId];
    if (!links) return;

    links.strategies.forEach((s) => {
      const nodeId = `strategy-${s.strategyId}`;
      if (!strategyYById.has(nodeId)) {
        strategyYById.set(nodeId, strategyCursor);
        strategyCursor += ROW_HEIGHT;
        nodes.push({
          id: nodeId,
          type: "default",
          position: { x: COLUMN_X.strategy, y: strategyYById.get(nodeId) ?? 0 },
          data: {
            entityType: "strategy",
            label: s.strategyName,
            entityId: String(s.strategyId),
          },
        });
      }
      edges.push({
        id: `e-${nodeId}-${decisionNodeId}`,
        source: nodeId,
        target: decisionNodeId,
        label: "applied via",
        data: { relationship: "applied via" },
      });
    });

    links.constraints.forEach((c) => {
      const nodeId = `constraint-${c.constraintId}`;
      if (!constraintYById.has(nodeId)) {
        constraintYById.set(nodeId, constraintCursor);
        constraintCursor += ROW_HEIGHT;
        nodes.push({
          id: nodeId,
          type: "default",
          position: { x: COLUMN_X.constraint, y: constraintYById.get(nodeId) ?? 0 },
          data: {
            entityType: "constraint",
            label: c.constraintType.replace("_", " "),
            entityId: String(c.constraintId),
          },
        });
      }
      edges.push({
        id: `e-${decisionNodeId}-${nodeId}`,
        source: decisionNodeId,
        target: nodeId,
        label: "constrained by",
        data: { relationship: "constrained by" },
      });
    });

    links.outcomes.forEach((o) => {
      const nodeId = `outcome-${o.outcomeId}`;
      nodes.push({
        id: nodeId,
        type: "default",
        position: { x: COLUMN_X.outcome, y: decisionY },
        data: {
          entityType: "outcome",
          label: o.outcomeStatus.replace("_", " "),
          entityId: String(o.outcomeId),
          status: o.outcomeStatus,
        },
      });
      edges.push({
        id: `e-${decisionNodeId}-${nodeId}`,
        source: decisionNodeId,
        target: nodeId,
        label: "resulted in",
        data: { relationship: "resulted in" },
      });
    });
  });

  return { nodes, edges };
}