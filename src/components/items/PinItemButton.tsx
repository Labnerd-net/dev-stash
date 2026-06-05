"use client";

import { Pin } from "lucide-react";
import { toggleItemPin } from "@/actions/favorites";
import { useItemToggle } from "@/hooks/useItemToggle";
import { cn } from "@/lib/utils";

interface PinItemButtonProps {
  itemId: string;
  isPinned: boolean;
}

export function PinItemButton({ itemId, isPinned }: PinItemButtonProps) {
  const { isPending, trigger } = useItemToggle(() => toggleItemPin(itemId));

  return (
    <button
      onClick={trigger}
      disabled={isPending}
      className={cn(
        "p-1 rounded transition-colors hover:text-amber-500 disabled:opacity-50",
        isPinned ? "text-amber-500" : "text-muted-foreground"
      )}
      aria-label={isPinned ? "Unpin item" : "Pin item"}
    >
      <Pin className="size-3.5" fill={isPinned ? "currentColor" : "none"} />
    </button>
  );
}
