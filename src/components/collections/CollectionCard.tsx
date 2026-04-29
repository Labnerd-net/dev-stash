import Link from "next/link";
import { FavoriteCollectionButton } from "./FavoriteCollectionButton";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: Date;
    isFavorite: boolean;
  };
  itemCount: number;
  dominantColor: string | null;
}

export function CollectionCard({
  collection,
  itemCount,
  dominantColor,
}: CollectionCardProps) {
  const accentColor = dominantColor ?? "#888";

  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card hover:bg-card/80 transition-colors overflow-hidden">
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: accentColor }} />
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/collections/${collection.id}`}
            className="min-w-0 flex-1 text-sm font-medium truncate group-hover:text-primary transition-colors"
          >
            {collection.name}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <FavoriteCollectionButton
              collectionId={collection.id}
              isFavorite={collection.isFavorite}
            />
          </div>
        </div>
        {collection.description && (
          <Link
            href={`/collections/${collection.id}`}
            className="text-xs text-muted-foreground line-clamp-2"
          >
            {collection.description}
          </Link>
        )}
      </div>
    </div>
  );
}
