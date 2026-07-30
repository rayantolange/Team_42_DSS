import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listThreads } from "@services/index";
import { useQueryStore } from "@store/queryStore";

export function useChatHistory() {
  const hydrateThreads = useQueryStore((s) => s.hydrateThreads);
  const { data } = useQuery({ queryKey: ["chatThreads"], queryFn: listThreads });

  useEffect(() => {
    if (data) hydrateThreads(data);
  }, [data, hydrateThreads]);
}