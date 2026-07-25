import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  useEdgesState,
  useNodesState,
  type OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./EntityNode";
import { getRelationshipStyle } from "./edgeStyles";
import { GraphLegend } from "./GraphLegend";
import type { DSSNode, DSSEdge } from "./graphDataBuilder";
import type { GraphNodeData } from "@/types/domain";

interface GraphCanvasProps {
  initialNodes: DSSNode[];
  initialEdges: DSSEdge[];
  onNodeSelect: (node: Node<GraphNodeData> | null) => void;
  selectedNodeId: string | null;
}

/**
 * React Flow canvas with zoom, pan, minimap, and node selection.
 * Search/filtering live in the sibling GraphFilters component and
 * operate on the data passed in as initialNodes/initialEdges, so this
 * component stays focused on rendering + interaction only.
 */
export function GraphCanvas({
  initialNodes,
  initialEdges,
  onNodeSelect,
  selectedNodeId,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Re-sync local React Flow state whenever filtered data changes
  // upstream (e.g. department filter or search term changes).
  const nodesKey = initialNodes.map((n) => n.id).join(",");
  const edgesKey = initialEdges.map((e) => e.id).join(",");
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesKey, edgesKey]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeSelect(node as Node<GraphNodeData>);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const noopOnConnect: OnConnect = useCallback(() => {
    // Connections are read-only in this explorer; users browse the
    // existing knowledge graph rather than author new edges here.
  }, []);

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        className: node.id === selectedNodeId ? "selected-graph-node" : undefined,
        selected: node.id === selectedNodeId,
      })),
    [nodes, selectedNodeId]
  );

  const styledEdges = useMemo(
    () =>
      edges.map((edge) => {
        const relStyle = getRelationshipStyle(edge.data?.relationship);
        return {
          ...edge,
          style: {
            stroke: relStyle.stroke,
            strokeWidth: 1.75,
            strokeDasharray: relStyle.dashed ? "4 4" : undefined,
          },
          labelStyle: { fontSize: 10, fill: "var(--muted-foreground, #64748b)" },
          labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.9 },
        };
      }),
    [edges]
  );

  return (
    <div
      className="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-xl border border-border bg-muted/10"
      role="application"
      aria-label="Knowledge graph explorer. Use mouse or touch to pan and zoom; select a node to view details."
    >
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={noopOnConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls aria-label="Zoom and pan controls" showInteractive={false} />
        <MiniMap pannable zoomable aria-label="Graph overview minimap" className="!bg-card" />
      </ReactFlow>
      <GraphLegend />
    </div>
  );
}
