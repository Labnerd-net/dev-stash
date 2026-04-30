"use client";

import { useEffect, useState } from "react";
import { getRecentItemIds } from "@/lib/recently-used";
import { fetchRecentItems } from "@/actions/recently-used";
import { ItemRow } from "@/components/items/ItemRow";
import type { ItemWithType } from "@/lib/item-queries";

export function RecentlyUsedSection() {
  const [mounted, setMounted] = useState(false);
  const [recentItems, setRecentItems] = useState<ItemWithType[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setMounted(true);
    const ids = getRecentItemIds();
    if (ids.length === 0) return;

    fetchRecentItems(ids).then(({ items, tagsMap }) => {
      setRecentItems(items);
      setTagsMap(tagsMap);
    });
  }, []);

  if (!mounted || recentItems.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Recently Used</h2>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {recentItems.map((row) => (
          <ItemRow
            key={row.item.id}
            row={row}
            tags={tagsMap[row.item.id]}
          />
        ))}
      </ul>
    </div>
  );
}
