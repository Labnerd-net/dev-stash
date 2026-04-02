"use client";

import { useState } from "react";

interface CollectionSelectorProps {
  collections: { id: string; name: string }[];
  initialSelectedIds?: string[];
}

export function CollectionSelector({
  collections,
  initialSelectedIds = [],
}: CollectionSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );

  if (collections.length === 0) return null;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="hasCollectionSelector" value="1" />
      <p className="text-sm font-medium">Add to Collections</p>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {collections.map((c) => (
          <label
            key={c.id}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <input
              type="checkbox"
              name="collectionId"
              value={c.id}
              checked={selectedIds.has(c.id)}
              onChange={() => toggle(c.id)}
              className="size-4 rounded border-border"
            />
            <span className="text-sm truncate">{c.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
