import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDecisions } from "@services/decisionService";
import { fetchAllDocuments } from "@services/decisionDocumentService";
import { fetchAllOutcomes } from "@services/outcomeService";

export interface AppNotification {
  id: string;
  kind: "decision" | "document" | "outcome";
  title: string;
  description: string;
  createdAt: string;
  decisionId: number;
}

const LOOKBACK_LIMIT = 20;

export function useNotifications() {
  const decisionsQuery = useQuery({
    queryKey: ["notifications", "decisions"],
    queryFn: () => fetchDecisions({ limit: LOOKBACK_LIMIT }),
  });
  const documentsQuery = useQuery({
    queryKey: ["notifications", "documents"],
    queryFn: fetchAllDocuments,
  });
  const outcomesQuery = useQuery({
    queryKey: ["notifications", "outcomes"],
    queryFn: fetchAllOutcomes,
  });

  const notifications = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = [];

    (decisionsQuery.data ?? []).forEach((d) => {
      items.push({
        id: `decision-${d.decisionId}`,
        kind: "decision",
        title: "New decision logged",
        description: d.title,
        createdAt: d.createdAt,
        decisionId: d.decisionId,
      });
    });

    (documentsQuery.data ?? []).forEach((doc) => {
      items.push({
        id: `document-${doc.documentId}`,
        kind: "document",
        title: "Document added",
        description: `${doc.fileName} was attached to a decision.`,
        createdAt: doc.createdAt,
        decisionId: doc.decisionId,
      });
    });

    (outcomesQuery.data ?? []).forEach((o) => {
      items.push({
        id: `outcome-${o.outcomeId}`,
        kind: "outcome",
        title: "Outcome recorded",
        description: `Marked as ${o.outcomeStatus.replace("_", " ")}.`,
        createdAt: o.createdAt,
        decisionId: o.decisionId,
      });
    });

    return items
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, LOOKBACK_LIMIT);
  }, [decisionsQuery.data, documentsQuery.data, outcomesQuery.data]);

  return {
    notifications,
    isLoading:
      decisionsQuery.isLoading ||
      documentsQuery.isLoading ||
      outcomesQuery.isLoading,
  };
}
