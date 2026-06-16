import { CollectionCard } from "./CollectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { CollectionWithMeta } from "@/lib/collection-queries";

interface CollectionGridProps {
  collections: CollectionWithMeta[];
}

export function CollectionGrid({ collections }: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <EmptyState
        message="No collections yet."
        action={{ label: "Create your first collection", href: "/collections/new" }}
      />
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
          previewTitles={c.previewTitles}
        />
      ))}
    </div>
  );
}
