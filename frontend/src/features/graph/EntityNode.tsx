import { Handle, Position, type NodeProps } from "reactflow";
import { Building2, FileText, GitCommitVertical, Scale, Flag } from "lucide-react";
import { cn } from "@utils/cn";
import type { GraphNodeData, EntityType } from "@/types/domain";

const ENTITY_CONFIG: Record<
  EntityType,
  { icon: typeof Building2; ring: string; bg: string; icon_: string }
> = {
  department: {
    icon: Building2,
    ring: "ring-blue-200 dark:ring-blue-800",
    bg: "bg-blue-500",
    icon_: "text-white",
  },
  policy: {
    icon: FileText,
    ring: "ring-violet-200 dark:ring-violet-800",
    bg: "bg-violet-500",
    icon_: "text-white",
  },
  decision: {
    icon: GitCommitVertical,
    ring: "ring-amber-200 dark:ring-amber-800",
    bg: "bg-amber-500",
    icon_: "text-white",
  },
  outcome: {
    icon: Flag,
    ring: "ring-emerald-200 dark:ring-emerald-800",
    bg: "bg-emerald-500",
    icon_: "text-white",
  },
  regulation: {
    icon: Scale,
    ring: "ring-slate-200 dark:ring-slate-700",
    bg: "bg-slate-500",
    icon_: "text-white",
  },
  role: {
    icon: Building2,
    ring: "ring-slate-200 dark:ring-slate-700",
    bg: "bg-slate-500",
    icon_: "text-white",
  },
};

/**
 * Generic entity node used for every node type in the graph. Rendered
 * as a colored circle (per entity type) with a caption label beneath
 * it — matching the Graph Explorer reference design — so the shape
 * of the network reads clearly even when zoomed out, while the label
 * stays fully readable at normal zoom.
 */
export function EntityNode({ data, selected }: NodeProps<GraphNodeData>) {
  const config = ENTITY_CONFIG[data.entityType];
  const Icon = config.icon;

  return (
    <div className="flex w-[132px] flex-col items-center gap-2">
      <Handle type="target" position={Position.Left} className="!invisible" />
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-md ring-4 ring-white transition-transform dark:ring-navy-900",
          config.bg,
          selected && "scale-110 ring-ring"
        )}
      >
        <Icon className={cn("h-6 w-6", config.icon_)} aria-hidden="true" />
      </div>
      <div className="rounded-md bg-card px-2 py-1 text-center shadow-card">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight">{data.label}</p>
        {data.subtitle && (
          <p className="truncate text-[10px] capitalize leading-tight text-muted-foreground">
            {data.subtitle}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!invisible" />
    </div>
  );
}

export const nodeTypes = {
  default: EntityNode,
};
