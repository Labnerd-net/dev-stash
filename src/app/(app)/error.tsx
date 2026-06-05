"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="text-xs text-muted-foreground max-w-sm">
        An unexpected error occurred. Try refreshing the page or going back.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
