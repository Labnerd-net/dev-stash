"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ItemRow } from "./ItemRow";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  bulkFavoriteItems,
  bulkPinItems,
  bulkDeleteItems,
  bulkAddToCollection,
  bulkAddTag,
} from "@/actions/items";
import type { ItemWithType } from "@/lib/item-queries";

interface BulkItemListProps {
  items: ItemWithType[];
  label: string;
  tagsMap?: Record<string, string[]>;
  collections?: { id: string; name: string }[];
}

export function BulkItemList({ items, label, tagsMap, collections = [] }: BulkItemListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [collectionId, setCollectionId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        message={`No ${label.toLowerCase()} yet.`}
        action={{ label: "Create your first one", href: "/items/new" }}
      />
    );
  }

  const allSelected = selectedIds.size === items.length;
  const selectedArr = Array.from(selectedIds);
  const count = selectedIds.size;

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((r) => r.item.id)));
  }

  function runAction(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      setSelectedIds(new Set());
      setConfirmDelete(false);
      router.refresh();
    });
  }

  const btnClass = "rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-40 transition-colors";
  const primaryBtnClass = "rounded px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors";

  return (
    <div className="space-y-2">
      {count > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          {confirmDelete ? (
            <>
              <span className="text-sm text-destructive font-medium">
                Delete {count} item{count === 1 ? "" : "s"}? This cannot be undone.
              </span>
              <button
                disabled={isPending}
                onClick={() => runAction(() => bulkDeleteItems(selectedArr))}
                className="rounded px-2 py-1 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
              >
                Confirm
              </button>
              <button
                disabled={isPending}
                onClick={() => setConfirmDelete(false)}
                className={btnClass}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="font-medium shrink-0">{count} selected</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  disabled={isPending}
                  onClick={() => runAction(() => bulkFavoriteItems(selectedArr, true))}
                  className={btnClass}
                >
                  {isPending ? "Favoriting…" : "Favorite"}
                </button>
                <button
                  disabled={isPending}
                  onClick={() => runAction(() => bulkPinItems(selectedArr, true))}
                  className={btnClass}
                >
                  {isPending ? "Pinning…" : "Pin"}
                </button>
                {collections.length > 0 && (
                  <div className="flex items-center gap-1">
                    <select
                      value={collectionId}
                      onChange={(e) => setCollectionId(e.target.value)}
                      disabled={isPending}
                      className="rounded border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
                    >
                      <option value="">Add to collection…</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {collectionId && (
                      <button
                        disabled={isPending}
                        onClick={() => {
                          const id = collectionId;
                          setCollectionId("");
                          runAction(() => bulkAddToCollection(selectedArr, id));
                        }}
                        className={primaryBtnClass}
                      >
                        Add
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        const tag = tagInput.trim();
                        setTagInput("");
                        runAction(() => bulkAddTag(selectedArr, tag));
                      }
                    }}
                    placeholder="Add tag…"
                    disabled={isPending}
                    className="w-24 rounded border border-border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground disabled:opacity-40"
                  />
                  {tagInput.trim() && (
                    <button
                      disabled={isPending}
                      onClick={() => {
                        const tag = tagInput.trim();
                        setTagInput("");
                        runAction(() => bulkAddTag(selectedArr, tag));
                      }}
                      className={primaryBtnClass}
                    >
                      Add
                    </button>
                  )}
                </div>
                <button
                  disabled={isPending}
                  onClick={() => setConfirmDelete(true)}
                  className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
                >
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
      <ul className="divide-y divide-border rounded-lg border border-border">
        <li className="flex items-center gap-3 px-4 py-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 cursor-pointer accent-primary"
          />
          <span className="text-xs text-muted-foreground select-none">
            {allSelected ? "Deselect all" : "Select all"}
          </span>
        </li>
        {items.map((row) => (
          <ItemRow
            key={row.item.id}
            row={row}
            tags={tagsMap?.[row.item.id]}
            isSelected={selectedIds.has(row.item.id)}
            onToggle={toggleItem}
          />
        ))}
      </ul>
    </div>
  );
}
