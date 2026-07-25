import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BrainCircuit, Sparkles } from "lucide-react";
import { QueryBuilder } from "@features/query/QueryBuilder";
import { QueryResults } from "@features/query/QueryResults";
import { QueryHistoryPanel } from "@features/query/QueryHistoryPanel";
import { useSubmitQuery } from "@features/query/useSubmitQuery";
import { useQueryStore } from "@store/queryStore";

interface QueryPageLocationState {
  prefillQuery?: string;
}

export default function QueryPage() {
  const submitQuery = useSubmitQuery();
  const currentResult = useQueryStore((s) => s.currentResult);
  const setCurrentResult = useQueryStore((s) => s.setCurrentResult);
  const location = useLocation();
  const prefillQuery = (location.state as QueryPageLocationState | null)?.prefillQuery;

  function handleSubmit(queryText: string, departmentId?: string) {
    submitQuery.mutate({ queryText, departmentId });
  }

  // Support the header's "Quick search" action, which routes here with
  // a prefilled query rather than duplicating the submit flow.
  useEffect(() => {
    if (prefillQuery) {
      submitQuery.mutate({ queryText: prefillQuery });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillQuery]);

  const hasActivity = Boolean(currentResult) || submitQuery.isPending || submitQuery.isError;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-8">
        {!hasActivity ? (
          // Vivid gradient "command panel" — the entry point to a query,
          // styled as the hero moment of the page rather than a plain form.
          <div className="relative overflow-hidden rounded-3xl bg-navy-gradient p-8 shadow-popover sm:p-12">
            <div className="absolute inset-0 bg-grid-overlay opacity-30" aria-hidden="true" />
            <div
              className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-violet/30 blur-3xl animate-float"
              aria-hidden="true"
            />
            <div
              className="absolute right-1/4 top-8 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl animate-float"
              style={{ animationDelay: "1.5s" }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col items-center gap-4 text-center animate-fade-in">
              <span className="glass-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Knowledge Graph + RAG powered
              </span>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                <BrainCircuit className="h-7 w-7" aria-hidden="true" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                What can I help you discover?
              </h1>
              <p className="max-w-md text-sm text-white/70">
                Access institutional knowledge and decision models with natural language.
              </p>
            </div>

            <div className="relative z-10 mx-auto mt-8 w-full max-w-2xl">
              <QueryBuilder onSubmit={handleSubmit} isSubmitting={submitQuery.isPending} elevated />
            </div>
          </div>
        ) : (
          <QueryBuilder onSubmit={handleSubmit} isSubmitting={submitQuery.isPending} />
        )}

        <QueryResults
          result={currentResult ?? undefined}
          isLoading={submitQuery.isPending}
          isError={submitQuery.isError}
          errorMessage={submitQuery.error instanceof Error ? submitQuery.error.message : undefined}
        />
      </div>

      <QueryHistoryPanel onSelect={setCurrentResult} activeQueryText={currentResult?.queryText} />
    </div>
  );
}
