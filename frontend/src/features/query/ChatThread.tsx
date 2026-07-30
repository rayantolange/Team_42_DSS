import { User, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@utils/cn";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    <div
      className={cn(
        "flex gap-3.5 w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* AI Avatar - Only shown for assistant messages */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sky-400 mt-0.5">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
      )}

      {/* Message Body & Metadata Container */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-2.5",
          isUser ? "items-end max-w-[80%]" : "max-w-[88%]",
        )}
      >
        {/* Main Text Content */}
        <div
          className={cn(
            "break-words text-[15px] leading-relaxed transition-all",
            isUser
              ? "rounded-2xl bg-zinc-800/80 px-4 py-2.5 text-zinc-100 shadow-sm"
              : "bg-transparent p-0 text-foreground",
          )}
        >
          {isUser ? (
            message.text
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ol:my-2 prose-ul:my-2 prose-li:my-0.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Inline Confidence Indicator Widget */}
        {!isUser &&
          message.confidenceScore !== undefined &&
          message.confidenceLevel && (
            <div className="w-full max-w-xs pt-1">
              <ConfidenceIndicator
                score={message.confidenceScore}
                level={message.confidenceLevel}
              />
            </div>
          )}

        {/* Inline Sources List Widget */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full max-w-md pt-1">
            <SourceList sources={message.sources} />
          </div>
        )}
      </div>

      {/* Optional User Avatar (Omitted or minimal to match native style) */}
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-300 text-xs mt-0.5">
          <User className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function PendingBubble() {
  return (
    <div className="flex gap-3.5 w-full justify-start items-center">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center text-sky-400">
        <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-sky-400"
          aria-hidden="true"
        />
        Thinking…
      </div>
    </div>
  );
}

function ErrorBubble({ message }: { message?: string }) {
  return (
    <div className="flex gap-3.5 w-full justify-start">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center text-rose-400 mt-0.5">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="text-sm text-rose-400 pt-0.5">
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
    <div className="flex flex-col gap-7 py-4 w-full">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <PendingBubble />}
      {isError && <ErrorBubble message={errorMessage} />}
    </div>
  );
}
