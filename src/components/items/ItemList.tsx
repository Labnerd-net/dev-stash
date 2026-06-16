import { ItemRow } from "./ItemRow";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ItemWithType } from "@/lib/item-queries";

interface ItemListProps {
  items: ItemWithType[];
  label: string;
  tagsMap?: Record<string, string[]>;
}

export function ItemList({ items, label, tagsMap }: ItemListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        message={`No ${label.toLowerCase()} yet.`}
        action={{ label: "Create your first one", href: "/items/new" }}
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((row) => (
        <ItemRow key={row.item.id} row={row} tags={tagsMap?.[row.item.id]} />
      ))}
    </ul>
  );
}
