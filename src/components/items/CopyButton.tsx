"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  content: string | null | undefined;
  className?: string;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

export function CopyButton({ content, className }: CopyButtonProps) {
  if (!content) return null;

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const text = content!.includes("<") ? stripHtml(content!) : content!;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-1 rounded transition-colors text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label="Copy to clipboard"
    >
      <Copy className="size-3.5" />
    </button>
  );
}
