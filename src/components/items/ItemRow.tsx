"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteItemButton } from "./DeleteItemButton";
import type { ItemWithType } from "@/lib/item-queries";

interface ItemRowProps {
  row: ItemWithType;
}

function getPreview(row: ItemWithType): string {
  const { item } = row;
  const text = item.content ?? item.url ?? item.description ?? "";
  return text.length > 120 ? text.slice(0, 120) + "…" : text;
}

export function ItemRow({ row }: ItemRowProps) {
  const router = useRouter();
  const { item, itemType } = row;
  const preview = getPreview(row);

  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <Link
            href={`/items/${item.id}`}
            className="text-sm font-medium hover:underline truncate"
          >
            {item.title}
          </Link>
          {item.language && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
              {item.language}
            </span>
          )}
        </div>
        {preview && (
          <p className="text-xs text-muted-foreground truncate">{preview}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: itemType.color ?? "#888" }}
        />
        <DeleteItemButton
          id={item.id}
          onSuccess={() => router.refresh()}
        />
      </div>
    </li>
  );
}
