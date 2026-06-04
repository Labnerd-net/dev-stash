"use client";

import { useEffect, useState } from "react";

const MAX_PREVIEW_BYTES = 100 * 1024; // 100 KB

interface Props {
  itemId: string;
  fileName: string;
}

export function TextFilePreview({ itemId, fileName }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/files/${itemId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.text();
      })
      .then((text) => {
        if (text.length > MAX_PREVIEW_BYTES) {
          setContent(text.slice(0, MAX_PREVIEW_BYTES));
          setTruncated(true);
        } else {
          setContent(text);
        }
      })
      .catch(() => setError(true));
  }, [itemId]);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">Could not load file preview.</p>
    );
  }

  if (content === null) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4">
        <p className="text-sm text-muted-foreground animate-pulse">Loading preview…</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <pre className="rounded-lg border border-border bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-[32rem] overflow-y-auto">
        {content}
      </pre>
      {truncated && (
        <p className="text-xs text-muted-foreground">
          Preview truncated at 100 KB.{" "}
          <a href={`/api/files/${itemId}`} download={fileName} className="text-primary hover:underline">
            Download full file
          </a>
        </p>
      )}
    </div>
  );
}
