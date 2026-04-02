import Link from "next/link";
import { CollectionCard } from "./CollectionCard";
import type { CollectionWithMeta } from "@/lib/collection-queries";

interface CollectionGridProps {
  collections: CollectionWithMeta[];
}

export function CollectionGrid({ collections }: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No collections yet.</p>
        <Link
          href="/collections/new"
          className="mt-3 text-sm text-primary hover:underline"
        >
          Create your first collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c) => (
        <CollectionCard
          key={c.collection.id}
          collection={c.collection}
          itemCount={c.itemCount}
          dominantColor={c.dominantColor}
        />
      ))}
    </div>
  );
}
