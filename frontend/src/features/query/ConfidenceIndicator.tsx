import { cn } from "@utils/cn";
import type { ConfidenceLevel } from "@/types/api";

interface ConfidenceIndicatorProps {
  score: number; // 0-1
  level: ConfidenceLevel;
}

const LEVEL_CONFIG: Record<
  ConfidenceLevel,
  { label: string; barColor: string; textColor: string; description: string }
> = {
  high: {
    label: "High Confidence",
    barColor: "bg-success",
    textColor: "text-success",
    description: "This answer is well-supported by closely matching policy records.",
  },
  medium: {
    label: "Medium Confidence",
    barColor: "bg-warning",
    textColor: "text-warning",
    description: "This answer is partially supported. Review the sources before relying on it.",
  },
  low: {
    label: "Low Confidence",
    barColor: "bg-destructive",
    textColor: "text-destructive",
    description: "Few or no closely matching policy records were found. Verify independently.",
  },
};

/**
 * Visual + textual confidence indicator. Pairs a percentage with a
 * plain-language description so administrators can judge how much
 * to trust an AI-generated answer without needing to interpret a
 * raw score themselves — central to this page's explainability goal.
 */
export function ConfidenceIndicator({ score, level }: ConfidenceIndicatorProps) {
  const config = LEVEL_CONFIG[level];
  const percent = Math.round(score * 100);

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="AI answer confidence">
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", config.textColor)}>{config.label}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence score: ${percent}%`}
      >
        <div
          className={cn("h-2 rounded-full transition-all", config.barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{config.description}</p>
    </div>
  );
}
