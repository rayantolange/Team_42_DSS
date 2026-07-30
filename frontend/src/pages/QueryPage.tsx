import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Sparkles } from "lucide-react";
import { QueryBuilder } from "@features/query/QueryBuilder";
import { QueryHistoryPanel } from "@features/query/QueryHistoryPanel";
import { useSubmitQuery } from "@features/query/useSubmitQuery";
import { useChatHistory } from "@features/query/useChatHistory";
import { useQueryStore } from "@store/queryStore";
import { ChatThread } from "@features/query/ChatThread";
import { getThreadMessages } from "@services/index";
import { cn } from "@utils/cn";

interface QueryPageLocationState {
  prefillQuery?: string;
}

function ChatSkeletonThread() {
  return (
    <div className="flex flex-col gap-7 py-4 w-full animate-pulse">
      {[85, 60, 92, 45].map((widthPct, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3.5 w-full",
            i % 2 === 0 ? "justify-end" : "justify-start",
          )}
        >
          {i % 2 !== 0 && (
            <div className="h-7 w-7 shrink-0 rounded-full bg-muted" />
          )}
          <div
            className="h-16 rounded-2xl bg-muted"
            style={{
              width: `${widthPct}%`,
              maxWidth: i % 2 === 0 ? "70%" : "85%",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function QueryPage() {
  useChatHistory();

  const submitQuery = useSubmitQuery();
  const { conversationId } = useParams(); // NEW — URL is now the source of truth
  const navigate = useNavigate(); // NEW

  const conversations = useQueryStore((s) => s.conversations);
  const ensureActiveConversation = useQueryStore(
    (s) => s.ensureActiveConversation,
  ); // NEW
  const selectConversation = useQueryStore((s) => s.selectConversation); // NEW
  const getThreadId = useQueryStore((s) => s.getThreadId);
  const setMessagesForConversation = useQueryStore(
    (s) => s.setMessagesForConversation,
  );

  const location = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === conversationId);
  const messages = activeConversation?.messages ?? [];
  const prefillHandledRef = useRef(false);

  // Keep the store's activeConversationId in sync with the URL, purely
  // so other components (e.g. the history panel's highlight) stay
  // consistent — the URL remains the actual source of truth.
  useEffect(() => {
    selectConversation(conversationId ?? null);
  }, [conversationId, selectConversation]);

  const activeThreadId = conversationId
    ? getThreadId(conversationId)
    : undefined;
  const shouldFetchMessages = activeConversation?.messagesLoaded === false;

  const { data: fetchedMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chatMessages", activeThreadId],
    queryFn: () => getThreadMessages(activeThreadId!),
    enabled: !!activeThreadId && shouldFetchMessages,
  });

  useEffect(() => {
    if (fetchedMessages && conversationId) {
      setMessagesForConversation(conversationId, fetchedMessages);
    }
  }, [fetchedMessages, conversationId, setMessagesForConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const prefillQuery = (location.state as QueryPageLocationState | null)
    ?.prefillQuery;

  function handleSubmit(queryText: string) {
    let id = conversationId;
    if (!id) {
      id = ensureActiveConversation();
      navigate(`/query/${id}`, { replace: true }); // URL updates immediately, before the response arrives
    }
    submitQuery.mutate({ conversationId: id, queryText });
  }

  useEffect(() => {
    if (prefillQuery && !prefillHandledRef.current) {
      prefillHandledRef.current = true;
      handleSubmit(prefillQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillQuery]);

  const isSwitchingConversation = shouldFetchMessages && isLoadingMessages;
  const hasActivity =
    messages.length > 0 ||
    submitQuery.isPending ||
    submitQuery.isError ||
    isSwitchingConversation;

  return (
    <div className="relative flex h-[calc(100vh-6rem)] w-full max-w-full gap-6 overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col h-full items-center justify-between">
        {isSwitchingConversation ? (
          <div className="flex flex-col h-full w-full max-w-3xl">
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 pr-3 scrollbar-thin">
              <ChatSkeletonThread />
            </div>
          </div>
        ) : !hasActivity ? (
          <div className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center px-2 sm:px-4">
            <div className="relative w-full overflow-hidden rounded-3xl bg-navy-gradient p-8 shadow-popover sm:p-12">
              <div
                className="absolute inset-0 bg-grid-overlay opacity-30"
                aria-hidden="true"
              />
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
                  Access institutional knowledge and decision models with
                  natural language.
                </p>
              </div>
              <div className="relative z-10 mx-auto mt-8 w-full max-w-2xl">
                <QueryBuilder
                  onSubmit={handleSubmit}
                  isSubmitting={submitQuery.isPending}
                  elevated
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full max-w-3xl">
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 pr-3 scrollbar-thin">
              <ChatThread
                messages={messages}
                isLoading={submitQuery.isPending}
                isError={submitQuery.isError}
                errorMessage={
                  submitQuery.error instanceof Error
                    ? submitQuery.error.message
                    : undefined
                }
              />
              <div ref={bottomRef} />
            </div>
            <div className="shrink-0 w-full bg-transparent pt-3 pb-2 px-2 sm:px-4">
              <QueryBuilder
                onSubmit={handleSubmit}
                isSubmitting={submitQuery.isPending}
              />
            </div>
          </div>
        )}
      </div>
      <div className="hidden shrink-0 h-full lg:block">
        <QueryHistoryPanel />
      </div>
    </div>
  );
}
