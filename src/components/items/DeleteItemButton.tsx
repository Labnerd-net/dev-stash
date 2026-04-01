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
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setError(null);

    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const result = await deleteItem(formData);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? "Failed to delete item");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
