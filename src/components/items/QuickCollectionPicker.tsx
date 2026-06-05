"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { toggleItemCollection } from "@/actions/collections";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
}

interface QuickCollectionPickerProps {
  itemId: string;
  allCollections: Collection[];
  currentCollections: Collection[];
}

export function QuickCollectionPicker({
  itemId,
  allCollections,
  currentCollections,
}: QuickCollectionPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const currentIds = new Set(currentCollections.map((c) => c.id));

  function toggle(collectionId: string) {
    startTransition(async () => {
      await toggleItemCollection(itemId, collectionId);
      router.refresh();
    });
  }

  if (allCollections.length === 0 && currentCollections.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Collections
        </p>
        {allCollections.length > 0 && (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              disabled={isPending}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Manage collections"
            >
              <Plus className="size-3" />
              Edit
            </button>
            {open && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-44 rounded-md border border-border bg-popover shadow-md">
                {allCollections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    disabled={isPending}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50",
                      currentIds.has(c.id) && "text-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        currentIds.has(c.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {currentCollections.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {currentCollections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No collections</p>
      )}
    </div>
  );
}
