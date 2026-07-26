import { User, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@utils/cn";
import { SourceList } from "./SourceList";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type { ChatMessage } from "@store/queryStore";

interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-primary",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      <div
        className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground",
          )}
        >
          {message.text}
        </div>
        {!isUser &&
          message.confidenceScore !== undefined &&
          message.confidenceLevel && (
            <div className="w-full max-w-xs rounded-lg border border-border bg-muted/30 p-3">
              <ConfidenceIndicator
                score={message.confidenceScore}
                level={message.confidenceLevel}
              />
            </div>
          )}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full max-w-md rounded-lg border border-border bg-muted/30 p-3">
            <SourceList sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}

function PendingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Thinking…
      </div>
    </div>
  );
}

function ErrorBubble({ message }: { message?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
        {message ?? "Something went wrong. Please try again."}
      </div>
    </div>
  );
}

export function ChatThread({
  messages,
  isLoading,
  isError,
  errorMessage,
}: ChatThreadProps) {
  if (messages.length === 0 && !isLoading && !isError) return null;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-background p-4 sm:p-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <PendingBubble />}
      {isError && <ErrorBubble message={errorMessage} />}
    </div>
  );
}
