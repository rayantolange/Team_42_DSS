import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { HistoryFilters, type HistoryFilterValues } from "@features/history/HistoryFilters";
import { DecisionTable } from "@features/history/DecisionTable";
import { DecisionDetailModal } from "@features/history/DecisionDetailModal";
import { useDecisionsList } from "@features/history/useDecisionHistory";
import type { DecisionRecordSummary } from "@/types/domain";

const PAGE_SIZE = 10;

export default function DecisionHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<HistoryFilterValues>({
    status: "all",
    searchTerm: "",
  });
  const [page, setPage] = useState(1);

  const deepLinkId = searchParams.get("decisionId");
  const [selectedDecisionId, setSelectedDecisionId] = useState<number | null>(
    deepLinkId ? Number(deepLinkId) : null
  );

  const decisionsQuery = useDecisionsList({
    statusFilter: filters.status === "all" ? undefined : filters.status,
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  function handleFiltersChange(next: HistoryFilterValues) {
    setFilters(next);
    setPage(1);
  }

  function handleSelectDecision(decision: DecisionRecordSummary) {
    setSelectedDecisionId(decision.decisionId);
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

  const decisions = decisionsQuery.data ?? [];
  const searchFiltered = filters.searchTerm.trim()
    ? decisions.filter((d) =>
        d.title.toLowerCase().includes(filters.searchTerm.trim().toLowerCase())
      )
    : decisions;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Decision History</h1>
        <p className="text-muted-foreground">
          Browse previous institutional decisions.
        </p>
      </div>

      <Card className="p-4">
        <HistoryFilters values={filters} onChange={handleFiltersChange} />
      </Card>

      {decisionsQuery.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Unable to load decision history. Please try refreshing the page.</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <DecisionTable
          decisions={searchFiltered}
          isLoading={decisionsQuery.isLoading}
          onSelectDecision={handleSelectDecision}
        />
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <p>Page {page}</p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={decisions.length < PAGE_SIZE}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      <DecisionDetailModal decisionId={selectedDecisionId} onOpenChange={handleModalOpenChange} />
    </div>
  );
}