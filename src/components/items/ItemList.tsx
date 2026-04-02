import Link from "next/link";
import { ItemRow } from "./ItemRow";
import type { ItemWithType } from "@/lib/item-queries";

interface ItemListProps {
  items: ItemWithType[];
  label: string;
  tagsMap?: Record<string, string[]>;
}

export function ItemList({ items, label, tagsMap }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()} yet.</p>
        <Link
          href="/items/new"
          className="mt-3 text-sm text-primary hover:underline"
        >
          Create your first one
        </Link>
      </div>
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
