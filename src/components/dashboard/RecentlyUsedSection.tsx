import { ItemRow } from "@/components/items/ItemRow";
import type { ItemWithType } from "@/lib/item-queries";

interface Props {
  items: ItemWithType[];
  tagsMap: Record<string, string[]>;
}

export function RecentlyUsedSection({ items, tagsMap }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Recently Used</h2>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((row) => (
          <ItemRow key={row.item.id} row={row} tags={tagsMap[row.item.id]} />
        ))}
      </ul>
    </div>
  );
}
