import { CollectionGrid } from "./CollectionGrid";
import type { CollectionWithMeta } from "@/lib/collection-queries";

interface CollectionSearchProps {
  collections: CollectionWithMeta[];
  q?: string;
}

export function CollectionSearch({ collections, q }: CollectionSearchProps) {
  return (
    <div className="space-y-4">
      <form action="/collections" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search collections…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {q && (
          <a
            href="/collections"
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Clear
          </a>
        )}
      </form>
      <CollectionGrid collections={collections} />
    </div>
  );
}
