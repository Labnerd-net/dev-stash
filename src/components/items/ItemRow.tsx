"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { DeleteItemButton } from "./DeleteItemButton";
import { FavoriteItemButton } from "./FavoriteItemButton";
import { PinItemButton } from "./PinItemButton";
import { CopyButton } from "./CopyButton";
import { LanguageBadge } from "./LanguageBadge";
import { toggleItemFavorite, toggleItemPin } from "@/actions/favorites";
import type { ItemWithType } from "@/lib/item-queries";
import { stripHtml, formatBytes } from "@/lib/html-utils";
import { getTypeColor } from "@/lib/utils";

interface ItemRowProps {
  row: ItemWithType;
  tags?: string[];
  isSelected?: boolean;
  onToggle?: (id: string) => void;
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


function getPreview(row: ItemWithType): string {
  const { item } = row;
  if (item.typeId === "system_file" || item.typeId === "system_image") {
    if (item.fileName) {
      return item.fileSize != null
        ? `${item.fileName} (${formatBytes(item.fileSize)})`
        : item.fileName;
    }
    return item.description ?? "";
  }
  let text = item.content ?? item.url ?? item.description ?? "";
  if (item.typeId === "system_note" && text.includes("<")) {
    text = stripHtml(text);
  }
  return text.length > 120 ? text.slice(0, 120) + "…" : text;
}

export function ItemRow({ row, tags, isSelected, onToggle }: ItemRowProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { item, itemType } = row;
  const preview = getPreview(row);
  const copyContent = getCopyContent(row);

  function handleKeyDown(e: React.KeyboardEvent<HTMLLIElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "f") {
      e.preventDefault();
      startTransition(async () => {
        await toggleItemFavorite(item.id);
        router.refresh();
      });
    } else if (e.key === "p") {
      e.preventDefault();
      startTransition(async () => {
        await toggleItemPin(item.id);
        router.refresh();
      });
    } else if (e.key === "c") {
      e.preventDefault();
      if (!copyContent) return;
      const text = copyContent.includes("<") ? stripHtml(copyContent) : copyContent;
      navigator.clipboard.writeText(text).then(
        () => toast.success("Copied to clipboard"),
        () => toast.error("Failed to copy")
      );
    }
  }

  return (
    <li
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`group flex items-start justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-sm${isSelected ? " bg-muted/20" : ""}`}
    >
      {onToggle && (
        <input
          type="checkbox"
          checked={isSelected ?? false}
          onChange={() => onToggle(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
        />
      )}
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
          <LanguageBadge language={item.language} />
        </div>
        {preview && (
          <p className="text-xs text-muted-foreground truncate">{preview}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
              >
                {tag}
              </Link>
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
          style={{ backgroundColor: getTypeColor(itemType.color) }}
        />
        <DeleteItemButton
          id={item.id}
          onSuccess={() => router.refresh()}
        />
      </div>
    </li>
  );
}
