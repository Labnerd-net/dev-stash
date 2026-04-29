"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleCollectionFavorite } from "@/actions/favorites";
import { cn } from "@/lib/utils";

interface FavoriteCollectionButtonProps {
  collectionId: string;
  isFavorite: boolean;
}

export function FavoriteCollectionButton({ collectionId, isFavorite }: FavoriteCollectionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleCollectionFavorite(collectionId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "shrink-0 p-1 rounded transition-colors hover:text-rose-500 disabled:opacity-50",
        isFavorite ? "text-rose-500" : "text-muted-foreground"
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className="size-3.5" fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
