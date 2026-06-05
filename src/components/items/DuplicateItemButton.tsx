"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateItem } from "@/actions/items";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

interface DuplicateItemButtonProps {
  itemId: string;
}

export function DuplicateItemButton({ itemId }: DuplicateItemButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await duplicateItem(itemId);
      if (result.success && result.data) {
        router.push(`/items/${result.data.id}`);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "disabled:opacity-50"
      )}
    >
      {isPending ? "Duplicating…" : "Duplicate"}
    </button>
  );
}
