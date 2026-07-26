import { LEGEND_ENTRIES } from "./edgeStyles";

/**
 * Floating legend explaining edge colors/styles, positioned over the
 * graph canvas — matches the "RELATIONSHIP LEGEND" card in the Figma
 * Graph Explorer reference.
 */
export function GraphLegend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 w-52 rounded-lg border border-border bg-card/95 p-3 shadow-popover backdrop-blur-sm">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Relationship Legend
      </p>
      <ul className="flex flex-col gap-1.5">
        {LEGEND_ENTRIES.map((entry) => (
          <li key={entry.category} className="flex items-center gap-2 text-xs">
            <svg width="18" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="18"
                y2="4"
                stroke={entry.stroke}
                strokeWidth={2}
                strokeDasharray={entry.dashed ? "3 3" : undefined}
              />
            </svg>
            <span className="text-foreground/80">{entry.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
