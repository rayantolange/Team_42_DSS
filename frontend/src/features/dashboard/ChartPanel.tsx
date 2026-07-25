import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/Card";
import type { DepartmentComparisonRow, TrendPoint } from "@services/index";
import { cn } from "@utils/cn";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#059669",
  negative: "#dc2626",
  neutral: "#94a3b8",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
};

const AXIS_TICK_STYLE = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const GRID_STROKE = "hsl(var(--border))";
const CHART_ANIMATION_MS = 900;

/** Shared tooltip styling — matches the app's card/shadow/border tokens instead of Recharts' plain default box. */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-popover">
      {label && <p className="mb-1 font-semibold text-popover-foreground">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-popover-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Renders the hovered donut slice slightly enlarged — the standard Recharts active-shape pattern. */
function renderActiveDonutShape(props: unknown) {
  const p = props as {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
  };
  return (
    <Sector
      cx={p.cx}
      cy={p.cy}
      innerRadius={p.innerRadius}
      outerRadius={p.outerRadius + 6}
      startAngle={p.startAngle}
      endAngle={p.endAngle}
      fill={p.fill}
      cornerRadius={6}
    />
  );
}

interface OutcomePieChartProps {
  data: { sentiment: string; count: number }[];
}

/** Donut chart of decision outcomes by sentiment, with a centered total and a clickable legend. */
export function OutcomePieChart({ data }: OutcomePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Card className="transition-shadow duration-200 hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Outcome Breakdown</CardTitle>
        <CardDescription>Distribution of decision outcomes by sentiment</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No decisions to display yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <div className="relative h-[220px] w-full max-w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="sentiment"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={90}
                    paddingAngle={3}
                    cornerRadius={6}
                    animationDuration={CHART_ANIMATION_MS}
                    activeIndex={hovered ? data.findIndex((d) => d.sentiment === hovered) : undefined}
                    activeShape={renderActiveDonutShape}
                    onMouseEnter={(entry: { sentiment?: string }) => setHovered(entry.sentiment ?? null)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.sentiment}
                        fill={SENTIMENT_COLORS[entry.sentiment] ?? "#999"}
                        opacity={hovered && hovered !== entry.sentiment ? 0.35 : 1}
                        className="transition-opacity duration-150"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight">{total}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto">
              {data.map((entry) => {
                const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                return (
                  <button
                    key={entry.sentiment}
                    type="button"
                    onMouseEnter={() => setHovered(entry.sentiment)}
                    onMouseLeave={() => setHovered(null)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      hovered === entry.sentiment ? "bg-accent" : "hover:bg-muted/60"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SENTIMENT_COLORS[entry.sentiment] }}
                    />
                    <span className="min-w-[64px] font-medium">
                      {SENTIMENT_LABELS[entry.sentiment] ?? entry.sentiment}
                    </span>
                    <span className="text-muted-foreground">{entry.count}</span>
                    <span className="ml-auto text-xs font-semibold text-muted-foreground">{pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DepartmentComparisonChartProps {
  data: DepartmentComparisonRow[];
}

/** Bar chart comparing decision volume and outcome mix across departments, with soft gradient fills. */
export function DepartmentComparisonChart({ data }: DepartmentComparisonChartProps) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Department Comparison</CardTitle>
        <CardDescription>Decision volume and outcomes by department</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No department data to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ left: 24 }} barGap={2}>
              <defs>
                {(["positive", "neutral", "negative"] as const).map((key) => (
                  <linearGradient key={key} id={`bar-gradient-${key}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={SENTIMENT_COLORS[key]} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={SENTIMENT_COLORS[key]} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
              <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
              <YAxis type="category" dataKey="departmentName" width={160} tick={AXIS_TICK_STYLE} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Bar
                dataKey="positive"
                stackId="a"
                fill="url(#bar-gradient-positive)"
                name="Positive"
                animationDuration={CHART_ANIMATION_MS}
              />
              <Bar
                dataKey="neutral"
                stackId="a"
                fill="url(#bar-gradient-neutral)"
                name="Neutral"
                animationDuration={CHART_ANIMATION_MS}
              />
              <Bar
                dataKey="negative"
                stackId="a"
                fill="url(#bar-gradient-negative)"
                name="Negative"
                radius={[0, 4, 4, 0]}
                animationDuration={CHART_ANIMATION_MS}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-4 border-t border-border pt-3">
          {(["positive", "neutral", "negative"] as const).map((key) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[key] }} />
              {SENTIMENT_LABELS[key]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendChartProps {
  data: TrendPoint[];
}

const TREND_SERIES = [
  { key: "approved" as const, label: "Approved", color: SENTIMENT_COLORS.positive },
  { key: "deferred" as const, label: "Deferred", color: SENTIMENT_COLORS.neutral },
  { key: "rejected" as const, label: "Rejected", color: SENTIMENT_COLORS.negative },
];

/** Smooth gradient area chart of decision status trends, with a clickable legend to isolate a series. */
export function TrendChart({ data }: TrendChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  function toggleSeries(key: string) {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Card className="transition-shadow duration-200 hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Decision Trends</CardTitle>
        <CardDescription>Monthly decision status over time</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Not enough data yet to show a trend.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data}>
                <defs>
                  {TREND_SERIES.map((s) => (
                    <linearGradient key={s.key} id={`trend-gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="month" tick={AXIS_TICK_STYLE} />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <Tooltip content={<ChartTooltip />} />
                {TREND_SERIES.filter((s) => !hiddenSeries.has(s.key)).map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.25}
                    fill={`url(#trend-gradient-${s.key})`}
                    animationDuration={CHART_ANIMATION_MS}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-3 flex flex-wrap justify-center gap-2 border-t border-border pt-3">
              {TREND_SERIES.map((s) => {
                const isHidden = hiddenSeries.has(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSeries(s.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      isHidden
                        ? "border-border text-muted-foreground/50 line-through"
                        : "border-transparent bg-muted/60 text-foreground hover:bg-muted"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full transition-opacity"
                      style={{ backgroundColor: s.color, opacity: isHidden ? 0.3 : 1 }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
