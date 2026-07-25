import { Sparkles, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Skeleton } from "@components/ui/Skeleton";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { SourceList } from "./SourceList";
import type { QueryResult } from "@/types/api";

interface QueryResultsProps {
  result: QueryResult | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

/**
 * Renders the full Query -> AI Response -> Sources -> Confidence flow.
 * This component is the centerpiece of the Query Interface's
 * explainability requirement: every answer is shown alongside its
 * supporting evidence and a plain-language confidence assessment,
 * never as an unattributed claim.
 */
export function QueryResults({ result, isLoading, isError, errorMessage }: QueryResultsProps) {
  if (isLoading) {
    return (
      <Card role="status" aria-busy="true">
        <span className="sr-only">Generating answer…</span>
        <CardHeader>
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-4 h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            {errorMessage ?? "Something went wrong while generating an answer. Please try again."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          AI-Generated Answer
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed">{result.answer}</p>

        <ConfidenceIndicator score={result.confidenceScore} level={result.confidenceLevel} />

        <SourceList sources={result.sources} />
      </CardContent>
    </Card>
  );
}
