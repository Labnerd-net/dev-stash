"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { restoreCollection, permanentDeleteCollection } from "@/actions/trash";
import type { getTrashedCollections } from "@/lib/collection-queries";

type TrashedCollection = Awaited<ReturnType<typeof getTrashedCollections>>[number];

const DAYS = 30;

function daysRemaining(deletedAt: Date): number {
  const msRemaining = deletedAt.getTime() + DAYS * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

function daysAgo(deletedAt: Date): number {
  return Math.floor((Date.now() - deletedAt.getTime()) / (24 * 60 * 60 * 1000));
}

interface TrashCollectionRowProps {
  row: TrashedCollection;
}

export function TrashCollectionRow({ row }: TrashCollectionRowProps) {
  const router = useRouter();
  const [isPendingRestore, startRestore] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const { collection } = row;
  const deletedAt = collection.deletedAt!;
  const remaining = daysRemaining(deletedAt);
  const ago = daysAgo(deletedAt);

  function handleRestore() {
    startRestore(async () => {
      await restoreCollection(collection.id);
      router.refresh();
    });
  }

  function handlePermanentDelete() {
    startDelete(async () => {
      await permanentDeleteCollection(collection.id);
      router.refresh();
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{collection.name}</span>
          {collection.description && (
            <span className="text-xs text-muted-foreground truncate">{collection.description}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
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
