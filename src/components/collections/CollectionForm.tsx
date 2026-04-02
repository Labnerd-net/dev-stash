"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCollection, updateCollection } from "@/actions/collections";
import type { CreateCollectionInput } from "@/lib/collection-schemas";

interface AllItem {
  id: string;
  title: string;
  typeId: string;
  typeColor: string | null;
}

interface CollectionFormProps {
  mode: "create" | "edit";
  allItems: AllItem[];
  initialValues?: Partial<CreateCollectionInput & { id: string }>;
  currentItemIds?: string[];
}

export function CollectionForm({
  mode,
  allItems,
  initialValues,
  currentItemIds = [],
}: CollectionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(currentItemIds)
  );

  function toggleItem(id: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    setError(null);

    const formData = new FormData(formRef.current);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCollection(formData)
          : await updateCollection(formData);

      if (!result.success || !result.data) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(`/collections/${result.data.id}`);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {mode === "edit" && initialValues?.id && (
        <input type="hidden" name="id" value={initialValues.id} />
      )}

      {/* Hidden inputs for selected items — ensures unchecked items are excluded */}
      {Array.from(selectedItemIds).map((itemId) => (
        <input
          key={itemId}
          type="hidden"
          name="collectionItemId"
          value={itemId}
        />
      ))}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialValues?.name ?? ""}
          placeholder="Give it a name"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          placeholder="What is this collection for?"
          className={`${inputClass} resize-y`}
        />
      </div>

      {allItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Items</p>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {allItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedItemIds.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="size-4 rounded border-border"
                />
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.typeColor ?? "#888" }}
                />
                <span className="text-sm truncate">{item.title}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedItemIds.size} item{selectedItemIds.size !== 1 ? "s" : ""}{" "}
            selected
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create Collection"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
