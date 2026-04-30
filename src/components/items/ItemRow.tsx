"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { DeleteItemButton } from "./DeleteItemButton";
import { FavoriteItemButton } from "./FavoriteItemButton";
import { PinItemButton } from "./PinItemButton";
import { CopyButton } from "./CopyButton";
import type { ItemWithType } from "@/lib/item-queries";

interface ItemRowProps {
  row: ItemWithType;
  tags?: string[];
}

const COPY_TYPE_IDS = new Set([
  "system_snippet",
  "system_command",
  "system_prompt",
  "system_note",
]);

function getCopyContent(row: ItemWithType): string | null {
  const { item } = row;
  if (COPY_TYPE_IDS.has(item.typeId)) return item.content ?? null;
  if (item.typeId === "system_url") return item.url ?? null;
  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getPreview(row: ItemWithType): string {
  const { item } = row;
  let text = item.content ?? item.url ?? item.description ?? "";
  if (item.typeId === "system_note" && text.includes("<")) {
    text = stripHtml(text);
  }
  return text.length > 120 ? text.slice(0, 120) + "…" : text;
}

export function ItemRow({ row, tags }: ItemRowProps) {
  const router = useRouter();
  const { item, itemType } = row;
  const preview = getPreview(row);
  const copyContent = getCopyContent(row);

  return (
    <li className="group flex items-start justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          {item.isPinned && (
            <Pin className="size-3 shrink-0 text-amber-500" fill="currentColor" />
          )}
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
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <CopyButton
          content={copyContent}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100"
        />
        <FavoriteItemButton itemId={item.id} isFavorite={item.isFavorite} />
        <PinItemButton itemId={item.id} isPinned={item.isPinned} />
        <span
          className="size-2 rounded-full mx-1"
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
