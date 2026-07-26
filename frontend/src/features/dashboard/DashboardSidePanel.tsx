import { Link } from "react-router-dom";
import { Plus, Upload, Sparkles, AlertTriangle, Activity, HardDrive, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import type { DepartmentComparisonRow } from "@services/mock/dashboardService";

interface DashboardSidePanelProps {
  departmentComparison: DepartmentComparisonRow[];
  storagePercentUsed: number;
}

/**
 * Finds the department with the most concerning negative/total ratio
 * (min. 3 decisions, so a single bad outcome doesn't trigger a false
 * alarm) — a real signal from the loaded data, not a scripted demo
 * alert. Returns null when nothing stands out.
 */
function findNotableDepartment(rows: DepartmentComparisonRow[]) {
  let worst: { row: DepartmentComparisonRow; ratio: number } | null = null;
  for (const row of rows) {
    if (row.totalDecisions < 3) continue;
    const ratio = row.negative / row.totalDecisions;
    if (ratio >= 0.34 && (!worst || ratio > worst.ratio)) {
      worst = { row, ratio };
    }
  }
  return worst;
}

export function DashboardSidePanel({ departmentComparison, storagePercentUsed }: DashboardSidePanelProps) {
  const notable = findNotableDepartment(departmentComparison);

  return (
    <div className="flex flex-col gap-5">
      <Card className="transition-shadow duration-200 hover:shadow-card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 pt-2">
          <Button asChild className="w-full justify-start">
            <Link to="/query">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Query
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to="/documents">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Document
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to="/query" state={{ prefillQuery: "Generate an insight summary for my department" }}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Generate Insight
            </Link>
          </Button>
        </CardContent>
      </Card>

      {notable ? (
        <Card className="border-warning/30 bg-warning/[0.06]">
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Elevated negative outcomes detected</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {notable.row.departmentName} has {notable.row.negative} of {notable.row.totalDecisions}{" "}
                  recent decisions marked as negative outcomes — worth a closer look.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
            >
              <Link to={`/history?departmentId=${notable.row.departmentId}`}>Review decisions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success/30 bg-success/[0.05]">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">No anomalies detected</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Outcomes look healthy across departments.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="transition-shadow duration-200 hover:shadow-card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Platform Health</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-2">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                Document storage
              </span>
              <span className="text-muted-foreground">{storagePercentUsed}%</span>
            </div>
            {storagePercentUsed > 0 ? (
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all ${
                    storagePercentUsed >= 80 ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${Math.max(storagePercentUsed, 3)}%` }}
                />
              </div>
            ) : (
              <div className="mt-2 flex h-2 w-full items-center overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full bg-[repeating-linear-gradient(135deg,hsl(var(--border))_0px,hsl(var(--border))_4px,transparent_4px,transparent_8px)] opacity-60" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Activity className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Query engine
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Operational
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
