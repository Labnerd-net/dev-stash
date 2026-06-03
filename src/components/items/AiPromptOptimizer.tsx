"use client";

import { useState, useTransition } from "react";
import { optimizePrompt } from "@/actions/ai";
import { CopyButton } from "./CopyButton";

export function AiPromptOptimizer({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await optimizePrompt(itemId);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error ?? "Failed to optimize prompt");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI</p>
        <button
          onClick={handleClick}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        >
          {isPending ? "Optimizing…" : "✨ Optimize prompt"}
        </button>
      </div>
      {result && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Optimized version</p>
            <CopyButton content={result} />
          </div>
          <pre className="rounded-lg border border-border bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
            {result}
          </pre>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
