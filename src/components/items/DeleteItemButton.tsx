"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteItem } from "@/actions/items";

interface DeleteItemButtonProps {
  id: string;
  onSuccess: () => void;
}

export function DeleteItemButton({ id, onSuccess }: DeleteItemButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const result = await deleteItem(formData);
      if (result.success) {
        onSuccess();
      } else {
        setConfirming(false);
        setError(result.error ?? "Failed to delete item");
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Move to trash?</span>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Moving…" : "Yes, trash it"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
