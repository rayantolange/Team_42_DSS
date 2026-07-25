import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Node } from "reactflow";
import { Building2, Network } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { useGraphStore } from "@store/graphStore";
import { GraphCanvas } from "@features/graph/GraphCanvas";
import { GraphFilters } from "@features/graph/GraphFilters";
import { NodeDetailPanel } from "@features/graph/NodeDetailPanel";
import { buildGraphData } from "@features/graph/graphDataBuilder";
import { DEPARTMENTS } from "@services/index";
import type { GraphNodeData } from "@/types/domain";

export default function GraphExplorerPage() {
  const { isAdmin, scopedDepartmentId } = useAuth();
  const [searchParams] = useSearchParams();

  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const [selectedNode, setSelectedNode] = useState<Node<GraphNodeData> | null>(null);
  const [dismissedStartPrompt, setDismissedStartPrompt] = useState(false);

  const effectiveDepartmentId = isAdmin ? filters.departmentId : scopedDepartmentId;

  // Deep-link support: /graph?nodeId=BAD-POL-001 (used by Query
  // Interface's "View in Knowledge Graph" links).
  const deepLinkNodeId = searchParams.get("nodeId");

  const { nodes, edges } = useMemo(
    () =>
      buildGraphData({
        departmentId: effectiveDepartmentId,
        entityTypes: filters.entityTypes,
      }),
    [effectiveDepartmentId, filters.entityTypes]
  );

  const filteredNodes = useMemo(() => {
    if (!filters.searchTerm.trim()) return nodes;
    const term = filters.searchTerm.trim().toLowerCase();
    return nodes.filter((n) => n.data.label.toLowerCase().includes(term));
  }, [nodes, filters.searchTerm]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(
    () => edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [edges, filteredNodeIds]
  );

  useEffect(() => {
    if (deepLinkNodeId) {
      const match = nodes.find((n) => n.data.entityId === deepLinkNodeId);
      if (match) {
        setSelectedNodeId(match.id);
        setSelectedNode(match);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkNodeId, nodes]);

  function handleNodeSelect(node: Node<GraphNodeData> | null) {
    setSelectedNode(node);
    setSelectedNodeId(node?.id ?? null);
  }

  // For admins with no scope chosen yet, rendering every department's
  // policies/decisions/outcomes at once is exactly the "overwhelming"
  // experience this page should avoid. Ask them to pick a starting
  // point first; department heads are always pre-scoped, so this
  // never applies to them, and it steps aside the moment a search
  // term, department, or deep link narrows things down.
  const showStartPrompt =
    isAdmin &&
    !effectiveDepartmentId &&
    !filters.searchTerm.trim() &&
    !deepLinkNodeId &&
    !dismissedStartPrompt;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Graph Explorer</h1>
        <p className="text-muted-foreground">
          Visually explore how departments, policies, decisions, and outcomes connect across the
          institution.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <GraphFilters
          searchTerm={filters.searchTerm}
          onSearchTermChange={(value) => setFilters({ searchTerm: value })}
          selectedEntityTypes={filters.entityTypes}
          onToggleEntityType={(type) => {
            const current = filters.entityTypes;
            const next = current.includes(type)
              ? current.filter((t) => t !== type)
              : [...current, type];
            setFilters({ entityTypes: next });
          }}
          departmentId={filters.departmentId}
          onDepartmentChange={(deptId) => setFilters({ departmentId: deptId })}
          isAdmin={isAdmin}
        />
      </div>

      {showStartPrompt ? (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Network className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold">Choose a department to start exploring</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Showing every department at once gets cluttered fast. Pick one below, search by
              name above, or view everything if you want the full picture.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => setFilters({ departmentId: dept.id })}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
              >
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {dept.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDismissedStartPrompt(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Or view every department at once
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-fade-in lg:grid-cols-[1fr_320px]">
          <GraphCanvas
            initialNodes={filteredNodes}
            initialEdges={filteredEdges}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
          />
          <NodeDetailPanel node={selectedNode} onClose={() => handleNodeSelect(null)} />
        </div>
      )}
    </div>
  );
}
