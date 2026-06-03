"use client";

import { useState, useTransition } from "react";
import { explainCode } from "@/actions/ai";

export function AiCodeExplainer({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await explainCode(itemId);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error ?? "Failed to explain code");
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
          {isPending ? "Explaining…" : "✨ Explain this code"}
        </button>
      </div>
      {result && (
        <p className="text-sm text-muted-foreground leading-relaxed">{result}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
