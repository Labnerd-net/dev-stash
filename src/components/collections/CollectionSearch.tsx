"use client";

import { useState } from "react";
import { CollectionGrid } from "./CollectionGrid";
import type { CollectionWithMeta } from "@/lib/collection-queries";

interface CollectionSearchProps {
  collections: CollectionWithMeta[];
}

export function CollectionSearch({ collections }: CollectionSearchProps) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? collections.filter((c) =>
        c.collection.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : collections;

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search collections…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <CollectionGrid collections={filtered} />
    </div>
  );
}
