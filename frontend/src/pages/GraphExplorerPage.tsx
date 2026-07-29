import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Node } from "reactflow";
import { AlertCircle } from "lucide-react";
import { useGraphStore } from "@store/graphStore";
import { GraphCanvas } from "@features/graph/GraphCanvas";
import { GraphFilters } from "@features/graph/GraphFilters";
import { NodeDetailPanel } from "@features/graph/NodeDetailPanel";
import { useGraphData, type GraphNodeData } from "@features/graph/useGraphData";
import { buildGraphData } from "@features/graph/graphDataBuilder";
import { Skeleton } from "@components/ui/Skeleton";

export default function GraphExplorerPage() {
  const [searchParams] = useSearchParams();
  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const [selectedNode, setSelectedNode] = useState<Node<GraphNodeData> | null>(
    null,
  );

  const deepLinkNodeId = searchParams.get("nodeId");

  const { data: rawData, isLoading, isError } = useGraphData();

  const { nodes, edges } = useMemo(() => {
    if (!rawData) return { nodes: [], edges: [] };
    return buildGraphData(rawData);
  }, [rawData]);

  const entityTypes = filters.entityTypes;

  const typeFilteredNodes = useMemo(
    () => nodes.filter((n) => entityTypes.includes(n.data.entityType)),
    [nodes, entityTypes],
  );

  const filteredNodes = useMemo(() => {
    if (!filters.searchTerm.trim()) return typeFilteredNodes;
    const term = filters.searchTerm.trim().toLowerCase();
    return typeFilteredNodes.filter((n) =>
      n.data.label.toLowerCase().includes(term),
    );
  }, [typeFilteredNodes, filters.searchTerm]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes],
  );
  const filteredEdges = useMemo(
    () =>
      edges.filter(
        (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target),
      ),
    [edges, filteredNodeIds],
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Graph Explorer</h1>
        <p className="text-muted-foreground">
          Visually explore how decisions connect to strategies, constraints, and
          outcomes.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <GraphFilters
          searchTerm={filters.searchTerm}
          onSearchTermChange={(value) => setFilters({ searchTerm: value })}
          selectedEntityTypes={entityTypes}
          onToggleEntityType={(type) => {
            const current = entityTypes;
            const next = current.includes(type)
              ? current.filter((t) => t !== type)
              : [...current, type];
            setFilters({ entityTypes: next });
          }}
        />
      </div>

      {isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Unable to load the graph. Please try refreshing the page.</span>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-[60vh] w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-fade-in lg:grid-cols-[1fr_320px]">
          <GraphCanvas
            initialNodes={filteredNodes}
            initialEdges={filteredEdges}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
          />
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => handleNodeSelect(null)}
          />
        </div>
      )}
    </div>
  );
}
