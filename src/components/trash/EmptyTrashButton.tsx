"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { emptyTrash } from "@/actions/trash";

export function EmptyTrashButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      await emptyTrash();
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Delete everything permanently?</span>
        <Button variant="destructive" size="sm" disabled={isPending} onClick={handleConfirm}>
          {isPending ? "Emptying…" : "Yes, empty trash"}
        </Button>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      Empty Trash
    </Button>
  );
}
