import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@components/ui/Card";
import { useCountUp } from "@hooks/useCountUp";
import { cn } from "@utils/cn";

export interface StatCardDef {
  label: string;
  /** Pre-formatted display value, used as a fallback when numericValue isn't provided (e.g. "42%"). */
  value: string;
  icon: LucideIcon;
  tint: string;
  /** Solid accent color (hex or CSS color) for the card's top bar and hover glow. */
  accent: string;
  /** Raw number to animate via count-up; when present, `value`'s suffix (e.g. "%") is preserved. */
  numericValue?: number;
  suffix?: string;
  /** Positive or negative percent change vs. the prior period, if known. */
  trend?: { direction: "up" | "down"; label: string; isGood: boolean };
  /** A small pulsing "Live" badge instead of a trend, for real-time metrics. */
  live?: boolean;
}

function StatValue({ stat }: { stat: StatCardDef }) {
  const animated = useCountUp(stat.numericValue ?? 0);
  if (stat.numericValue === undefined) {
    return <>{stat.value}</>;
  }
  const rounded = Math.round(animated);
  return (
    <>
      {rounded.toLocaleString()}
      {stat.suffix ?? ""}
    </>
  );
}

/** Top-row summary metric cards: colored accent bar, icon square, animated big number, and a trend/live indicator. */
export function StatCards({ stats }: { stats: StatCardDef[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card
          key={stat.label}
          className="group relative animate-fade-in-up overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
          style={{
            animationDelay: `${i * 70}ms`,
            animationFillMode: "backwards",
            boxShadow: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 10px 28px -10px ${stat.accent}55, 0 4px 10px -4px rgb(15 23 42 / 0.08)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)";
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1 origin-left scale-x-75 transition-transform duration-300 group-hover:scale-x-100"
            style={{ backgroundColor: stat.accent }}
            aria-hidden="true"
          />
          <CardContent className="flex items-start justify-between gap-3 pt-6">
            <div>
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                  stat.tint
                )}
              >
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 text-2xl font-bold leading-none tabular-nums tracking-tight">
                <StatValue stat={stat} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>

            {stat.live && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Live
              </span>
            )}
            {stat.trend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  stat.trend.isGood ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                {stat.trend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                {stat.trend.label}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
