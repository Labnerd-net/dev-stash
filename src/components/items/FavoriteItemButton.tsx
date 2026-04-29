"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleItemFavorite } from "@/actions/favorites";
import { cn } from "@/lib/utils";

interface FavoriteItemButtonProps {
  itemId: string;
  isFavorite: boolean;
}

export function FavoriteItemButton({ itemId, isFavorite }: FavoriteItemButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleItemFavorite(itemId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
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
