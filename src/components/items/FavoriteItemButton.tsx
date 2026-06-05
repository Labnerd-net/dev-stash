"use client";

import { Heart } from "lucide-react";
import { toggleItemFavorite } from "@/actions/favorites";
import { useItemToggle } from "@/hooks/useItemToggle";
import { cn } from "@/lib/utils";

interface FavoriteItemButtonProps {
  itemId: string;
  isFavorite: boolean;
}

export function FavoriteItemButton({ itemId, isFavorite }: FavoriteItemButtonProps) {
  const { isPending, trigger } = useItemToggle(() => toggleItemFavorite(itemId));

  return (
    <button
      onClick={trigger}
      disabled={isPending}
      className={cn(
        "p-1 rounded transition-colors hover:text-rose-500 disabled:opacity-50",
        isFavorite ? "text-rose-500" : "text-muted-foreground"
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className="size-3.5" fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
