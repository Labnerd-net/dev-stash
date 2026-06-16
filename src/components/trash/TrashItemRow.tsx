"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { restoreItem, permanentDeleteItem } from "@/actions/trash";
import type { getTrashedItems } from "@/lib/item-queries";

type TrashedItem = Awaited<ReturnType<typeof getTrashedItems>>[number];

const DAYS = 30;

function daysRemaining(deletedAt: Date): number {
  const msRemaining = deletedAt.getTime() + DAYS * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

function daysAgo(deletedAt: Date): number {
  return Math.floor((Date.now() - deletedAt.getTime()) / (24 * 60 * 60 * 1000));
}

interface TrashItemRowProps {
  row: TrashedItem;
}

export function TrashItemRow({ row }: TrashItemRowProps) {
  const router = useRouter();
  const [isPendingRestore, startRestore] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const { item, itemType } = row;
  const deletedAt = item.deletedAt!;
  const remaining = daysRemaining(deletedAt);
  const ago = daysAgo(deletedAt);

  function handleRestore() {
    startRestore(async () => {
      await restoreItem(item.id);
      router.refresh();
    });
  }

  function handlePermanentDelete() {
    startDelete(async () => {
      await permanentDeleteItem(item.id);
      router.refresh();
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: itemType.color ?? "#888" }}
          />
          <span className="text-sm font-medium truncate">{item.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{itemType.name}</span>
        </div>
        <p className="text-xs text-muted-foreground pl-4">
          Deleted {ago === 0 ? "today" : `${ago}d ago`} · {remaining}d remaining
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPendingRestore || isPendingDelete}
          onClick={handleRestore}
        >
          {isPendingRestore ? "Restoring…" : "Restore"}
        </Button>
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Permanent?</span>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPendingDelete}
              onClick={handlePermanentDelete}
            >
              {isPendingDelete ? "Deleting…" : "Yes, delete"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPendingDelete}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={isPendingRestore || isPendingDelete}
            onClick={() => setConfirming(true)}
          >
            Delete permanently
          </Button>
        )}
      </div>
    </li>
  );
}
