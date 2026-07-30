import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, ArrowUp, Mic, Globe, MessageSquare } from "lucide-react";
import { cn } from "@utils/cn";
import { useQueryStore } from "@store/queryStore";

interface QueryBuilderProps {
  onSubmit: (queryText: string, departmentId?: string) => void;
  isSubmitting?: boolean;
  elevated?: boolean;
}

export function QueryBuilder({ onSubmit, isSubmitting }: QueryBuilderProps) {
  const [query, setQuery] = useState("");
  const mode = useQueryStore((s) => s.mode);
  const setMode = useQueryStore((s) => s.setMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [query]);

  const handleSubmit = () => {
    if (!query.trim() || isSubmitting) return;
    onSubmit(query.trim());
    setQuery("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      {/* Theme-Integrated Pill Capsule Container */}
      <div className="relative flex flex-col justify-between rounded-[28px] border border-border/40 bg-card/80 p-3.5 shadow-xl backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-card hover:border-border/70">
        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about institutional data, reports, or trends…"
          rows={1}
          className="w-full resize-none border-none bg-transparent px-3 pt-1 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none max-h-40 scrollbar-thin"
        />

        {/* Bottom Bar: Action Controls & Send */}
        <div className="mt-3 flex items-center justify-between gap-2 px-1 pt-1">
          {/* Left Side: Add Attachment & Mode Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Add attachment"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* Mode Pills (Search / Chat) */}
            <div className="flex items-center gap-1 rounded-full bg-navy-950/60 p-1 text-xs border border-border/30">
              <button
                type="button"
                onClick={() => setMode("search")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all",
                  mode === "search"
                    ? "bg-navy-800 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Search
              </button>
              <button
                type="button"
                onClick={() => setMode("chat")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all",
                  mode === "chat"
                    ? "bg-navy-800 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
            </div>
          </div>

          {/* Right Side: Voice Mic & Submit Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Use voice input"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!query.trim() || isSubmitting}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                query.trim() && !isSubmitting
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  : "bg-navy-800/80 text-muted-foreground/40 cursor-not-allowed",
              )}
            >
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Knowledge Graph + RAG models can make mistakes. Verify critical facts.
      </p>
    </div>
  );
}
