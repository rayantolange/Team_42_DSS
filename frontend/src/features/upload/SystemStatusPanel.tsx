import { useMemo } from "react";
import { HardDrive, Gauge, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import type { UploadedDocument } from "@/types/domain";

interface SystemStatusPanelProps {
  documents: UploadedDocument[];
}

const CAPACITY_BYTES = 1024 ** 4; // 1 TB, matches the Figma "/ 1 TB" reference

function formatGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(0)} GB`;
}

// Illustrative recent-latency samples for the sparkline. Real
// telemetry would replace this with a time-series from the ingestion
// pipeline; the shape here just needs to read as "mostly fast, one
// recent blip" to match the reference design.
const LATENCY_SAMPLES = [38, 52, 44, 61, 35, 90, 58];

/**
 * Right-hand "System Status" rail on the Document Management page.
 * Storage usage is derived from real uploaded-document sizes so the
 * number stays honest as documents are added/removed; processing
 * latency and the knowledge-base growth note are illustrative
 * platform telemetry, consistent with the rest of this prototype's
 * mocked backend.
 */
export function SystemStatusPanel({ documents }: SystemStatusPanelProps) {
  const usedBytes = useMemo(
    () => documents.reduce((sum, doc) => sum + doc.fileSizeBytes, 0),
    [documents]
  );
  const percentUsed = Math.min(100, Math.round((usedBytes / CAPACITY_BYTES) * 100));
  const isNearCapacity = percentUsed >= 80;

  const tokensIndexed = Math.max(0, Math.round(usedBytes / 512));
  const maxLatency = Math.max(...LATENCY_SAMPLES);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-2">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              Storage Capacity
            </span>
            <span className="text-muted-foreground">
              {formatGb(usedBytes)} / 1 TB
            </span>
          </div>
          {percentUsed > 0 ? (
            <div
              className="mt-2 h-2 w-full rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={percentUsed}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Storage capacity used"
            >
              <div
                className={`h-2 rounded-full transition-all ${
                  isNearCapacity ? "bg-warning" : "bg-primary"
                }`}
                style={{ width: `${Math.max(percentUsed, 3)}%` }}
              />
            </div>
          ) : (
            <div
              className="mt-2 flex h-2 w-full items-center overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Storage capacity used"
            >
              <div className="h-full w-full bg-[repeating-linear-gradient(135deg,hsl(var(--border))_0px,hsl(var(--border))_4px,transparent_4px,transparent_8px)] opacity-60" />
            </div>
          )}
          {isNearCapacity && (
            <p className="mt-1.5 text-xs text-warning">
              Critical threshold reached. Consider upgrading workspace.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Avg Processing Time</span>
            <span className="font-semibold text-primary">1.2s</span>
          </div>
          <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden="true">
            {LATENCY_SAMPLES.map((value, i) => (
              <div
                key={i}
                className={`w-full rounded-sm ${
                  i === LATENCY_SAMPLES.length - 2 ? "bg-primary" : "bg-primary/25"
                }`}
                style={{ height: `${(value / maxLatency) * 100}%` }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Latency is optimal for real-time querying.
          </p>
        </div>

        <div className="rounded-lg bg-accent p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Intelligence Metric
          </p>
          <p className="mt-1.5 text-lg font-bold text-foreground">
            {tokensIndexed.toLocaleString()} Tokens Indexed
          </p>
          <p className="text-xs text-muted-foreground">
            Total knowledge base grew {documents.length > 0 ? "with this session's uploads" : "steadily"}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
