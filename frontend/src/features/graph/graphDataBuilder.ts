  import type { Node, Edge } from "reactflow";
  import { DEPARTMENTS, POLICIES } from "@/data/datasetLoader";
  import { DECISIONS } from "@/data/decisionGenerator";
  import type { GraphNodeData, GraphEdgeData, EntityType } from "@/types/domain";

  export type DSSNode = Node<GraphNodeData>;
  export type DSSEdge = Edge<GraphEdgeData>;

  interface BuildGraphOptions {
    departmentId?: string | null;
    entityTypes?: EntityType[];
  }

  const COLUMN_X: Record<EntityType, number> = {
    department: 0,
    policy: 320,
    decision: 640,
    outcome: 960,
    regulation: -320, // regulations sit in a side lane, left of departments
    role: 320,
  };

  const ROW_HEIGHT = {
    department: 140,
    policy: 120,
    decisionOutcome: 110,
    regulation: 110,
  };

  /**
   * Builds a React Flow graph from the policy dataset, organized in
   * loose columns by entity type (Department -> Policy -> Decision ->
   * Outcome), with Regulations branching off their governing policy.
   *
   * Row position within each column comes from a running cursor that
   * only ever increases, rather than an index formula scoped to the
   * current department. Multiple departments necessarily add up to
   * many total policies/decisions in the same column — an index-based
   * formula that resets per department causes rows from different
   * departments to land on the same Y and visually collide once the
   * dataset is large. Monotonic cursors guarantee every node in a
   * column gets its own row, no matter how much data is loaded.
   *
   * Labels and relationship text use organizational language
   * ("governs", "led to", "resulted in") rather than raw graph/DB
   * terminology, per the UX requirement that this page reads
   * naturally to academic administrators.
   */
  export function buildGraphData(options: BuildGraphOptions = {}): { nodes: DSSNode[]; edges: DSSEdge[] } {
    const { departmentId, entityTypes } = options;

    const includeType = (type: EntityType) => !entityTypes || entityTypes.includes(type);

    const departments = departmentId
      ? DEPARTMENTS.filter((d) => d.id === departmentId)
      : DEPARTMENTS;

    const nodes: DSSNode[] = [];
    const edges: DSSEdge[] = [];

    const regulationYById = new Map<string, number>();
    let regulationCursor = 0;
    let policyCursor = 0;
    let decisionOutcomeCursor = 0;

    departments.forEach((dept) => {
      const deptStartY = policyCursor; // anchor the department roughly beside its first policy

      if (includeType("department")) {
        nodes.push({
          id: `dept-${dept.id}`,
          type: "default",
          position: { x: COLUMN_X.department, y: deptStartY },
          data: {
            entityType: "department",
            label: dept.name,
            entityId: dept.id,
            subtitle: dept.type,
          },
        });
      }

      const deptPolicies = POLICIES.filter((p) => p.departmentId === dept.id);

      deptPolicies.forEach((policy) => {
        const policyY = policyCursor;
        policyCursor += ROW_HEIGHT.policy;

        if (includeType("policy")) {
          nodes.push({
            id: `policy-${policy.id}`,
            type: "default",
            position: { x: COLUMN_X.policy, y: policyY },
            data: {
              entityType: "policy",
              label: policy.title,
              entityId: policy.id,
              subtitle: policy.category,
            },
          });

          if (includeType("department")) {
            edges.push({
              id: `e-dept-${dept.id}-policy-${policy.id}`,
              source: `dept-${dept.id}`,
              target: `policy-${policy.id}`,
              label: "governs",
              data: { relationship: "governs" },
            });
          }

          // Regulations: one node per distinct legal basis, shared across
          // policies that cite it, positioned in a side lane.
          if (includeType("regulation")) {
            policy.legalBasis.slice(0, 2).forEach((reg) => {
              const regId = `reg-${reg.replace(/\W+/g, "-").toLowerCase()}`;
              if (!regulationYById.has(regId)) {
                regulationYById.set(regId, regulationCursor);
                regulationCursor += ROW_HEIGHT.regulation;
                nodes.push({
                  id: regId,
                  type: "default",
                  position: { x: COLUMN_X.regulation, y: regulationYById.get(regId) ?? 0 },
                  data: {
                    entityType: "regulation",
                    label: reg,
                    entityId: regId,
                  },
                });
              }
              edges.push({
                id: `e-${regId}-policy-${policy.id}`,
                source: regId,
                target: `policy-${policy.id}`,
                label: "required by",
                data: { relationship: "required by" },
              });
            });
          }
        }

        // Decisions + outcomes for this policy
        if (includeType("decision")) {
          const decisions = DECISIONS.filter((d) => d.policyId === policy.id).slice(0, 3);
          decisions.forEach((decision) => {
            const decisionY = decisionOutcomeCursor;
            decisionOutcomeCursor += ROW_HEIGHT.decisionOutcome;

            nodes.push({
              id: `decision-${decision.id}`,
              type: "default",
              position: { x: COLUMN_X.decision, y: decisionY },
              data: {
                entityType: "decision",
                label: decision.title,
                entityId: decision.id,
                subtitle: decision.status,
                status: decision.status,
              },
            });

            if (includeType("policy")) {
              edges.push({
                id: `e-policy-${policy.id}-decision-${decision.id}`,
                source: `policy-${policy.id}`,
                target: `decision-${decision.id}`,
                label: "applied in",
                data: { relationship: "applied in" },
              });
            }

            if (includeType("outcome")) {
              const outcomeId = `outcome-${decision.id}`;
              nodes.push({
                id: outcomeId,
                type: "default",
                position: { x: COLUMN_X.outcome, y: decisionY },
                data: {
                  entityType: "outcome",
                  label: decision.outcomeLabel,
                  entityId: outcomeId,
                  subtitle: decision.outcomeSentiment,
                  status: decision.outcomeSentiment,
                },
              });

              edges.push({
                id: `e-decision-${decision.id}-outcome-${outcomeId}`,
                source: `decision-${decision.id}`,
                target: outcomeId,
                label: "resulted in",
                data: { relationship: "resulted in" },
              });
            }
          });
        }
      });
    });

    return { nodes, edges };
  }
