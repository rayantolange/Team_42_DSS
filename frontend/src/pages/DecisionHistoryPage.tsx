import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { HistoryFilters, type HistoryFilterValues } from "@features/history/HistoryFilters";
import { DecisionTable } from "@features/history/DecisionTable";
import { DecisionDetailModal } from "@features/history/DecisionDetailModal";
import { useDecisionsList } from "@features/history/useDecisionHistory";
import type { Decision } from "@/types/domain";

const PAGE_SIZE = 10;

export default function DecisionHistoryPage() {
  const { isAdmin, scopedDepartmentId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<HistoryFilterValues>({
    departmentId: isAdmin ? null : scopedDepartmentId,
    status: [],
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);

  // Support deep-linking from Dashboard's "Recent Decisions" links
  // (/history?decisionId=...) by opening the modal directly.
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    searchParams.get("decisionId")
  );

  const effectiveDepartmentId = isAdmin ? filters.departmentId : scopedDepartmentId;

  const decisionsQuery = useDecisionsList({
    departmentId: effectiveDepartmentId,
    status: filters.status.length > 0 ? filters.status : undefined,
    searchTerm: filters.searchTerm || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  function handleFiltersChange(next: HistoryFilterValues) {
    setFilters(next);
    setPage(1); // reset pagination whenever filters change
  }

  function handleSelectDecision(decision: Decision) {
    setSelectedDecisionId(decision.id);
  }

  function handleModalOpenChange(open: boolean) {
    if (!open) {
      setSelectedDecisionId(null);
      if (searchParams.has("decisionId")) {
        const next = new URLSearchParams(searchParams);
        next.delete("decisionId");
        setSearchParams(next, { replace: true });
      }
    }
  }

  const total = decisionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Decision History</h1>
        <p className="text-muted-foreground">
          Browse and filter previous institutional decisions across departments.
        </p>
      </div>

      <Card className="p-4">
        <HistoryFilters values={filters} onChange={handleFiltersChange} isAdmin={isAdmin} />
      </Card>

      {decisionsQuery.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Unable to load decision history. Please try refreshing the page.</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <DecisionTable
          decisions={decisionsQuery.data?.items ?? []}
          isLoading={decisionsQuery.isLoading}
          onSelectDecision={handleSelectDecision}
        />

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <p>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}{" "}
              decisions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <span aria-live="polite">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <DecisionDetailModal decisionId={selectedDecisionId} onOpenChange={handleModalOpenChange} />
    </div>
  );
}
