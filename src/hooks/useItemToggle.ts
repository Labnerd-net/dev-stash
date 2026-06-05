"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function useItemToggle(action: () => Promise<unknown>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function trigger(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return { isPending, trigger };
}
