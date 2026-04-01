"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ItemTypeSelector } from "./ItemTypeSelector";
import { COMMON_LANGUAGES, TYPE_FIELD_CONFIG } from "@/lib/item-type-map";
import { createItem, updateItem } from "@/actions/items";
import type { CreateItemInput } from "@/lib/item-schemas";

interface ItemType {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ItemFormProps {
  mode: "create" | "edit";
  types: ItemType[];
  initialValues?: Partial<CreateItemInput & { id: string }>;
  defaultTypeId?: string;
}

export function ItemForm({ mode, types, initialValues, defaultTypeId }: ItemFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState(
    defaultTypeId ?? initialValues?.typeId ?? types[0]?.id ?? ""
  );

  const fieldConfig = TYPE_FIELD_CONFIG[selectedTypeId] ?? {
    hasContent: false,
    hasLanguage: false,
    hasUrl: false,
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    setError(null);

    const formData = new FormData(formRef.current);
    formData.set("typeId", selectedTypeId);

    startTransition(async () => {
      const result = mode === "create"
        ? await createItem(formData)
        : await updateItem(formData);

      if (!result.success || !result.data) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(`/items/${result.data.id}`);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {mode === "edit" && initialValues?.id && (
        <input type="hidden" name="id" value={initialValues.id} />
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Type</label>
        <ItemTypeSelector
          types={types}
          value={selectedTypeId}
          onChange={setSelectedTypeId}
          disabled={mode === "edit"}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialValues?.title ?? ""}
          placeholder="Give it a name"
          className={inputClass}
        />
      </div>

      {fieldConfig.hasContent && (
        <div className="space-y-1.5">
          <label htmlFor="content" className="text-sm font-medium">Content</label>
          <textarea
            id="content"
            name="content"
            rows={10}
            defaultValue={initialValues?.content ?? ""}
            placeholder="Paste your content here…"
            className={`${inputClass} resize-y font-mono`}
          />
        </div>
      )}

      {fieldConfig.hasLanguage && (
        <div className="space-y-1.5">
          <label htmlFor="language" className="text-sm font-medium">Language</label>
          <select
            id="language"
            name="language"
            defaultValue={initialValues?.language ?? ""}
            className={inputClass}
          >
            <option value="">Select a language</option>
            {COMMON_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      )}

      {fieldConfig.hasUrl && (
        <div className="space-y-1.5">
          <label htmlFor="url" className="text-sm font-medium">URL</label>
          <input
            id="url"
            name="url"
            type="url"
            defaultValue={initialValues?.url ?? ""}
            placeholder="https://"
            className={inputClass}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          placeholder="Add a short description…"
          className={`${inputClass} resize-y`}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === "create" ? "Creating…" : "Saving…"
            : mode === "create" ? "Create Item" : "Save Changes"}
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
