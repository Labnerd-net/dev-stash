"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ItemTypeSelector } from "./ItemTypeSelector";
import { CollectionSelector } from "./CollectionSelector";
import { TagSelector } from "./TagSelector";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { TipTapEditor } from "./TipTapEditor";
import { COMMON_LANGUAGES, TYPE_FIELD_CONFIG } from "@/lib/item-type-map";
import { createItem, updateItem } from "@/actions/items";
import { suggestTagsFromContent } from "@/actions/ai";
import type { CreateItemInput } from "@/lib/item-schemas";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";
import { formatBytes } from "@/lib/html-utils";

const MAX_SIZE = MAX_UPLOAD_SIZE;

type UploadState = "idle" | "uploading" | "done" | "error";

const CODE_TYPE_IDS = ["system_snippet", "system_command", "system_prompt"];
const NOTE_TYPE_IDS = ["system_note"];

interface ItemType {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ItemFormProps {
  mode: "create" | "edit";
  types: ItemType[];
  initialValues?: Partial<CreateItemInput & { id: string; fileUrl?: string | null; fileName?: string | null; fileSize?: number | null }>;
  defaultTypeId?: string;
  collections?: { id: string; name: string }[];
  initialCollectionIds?: string[];
  userTags?: { id: string; name: string }[];
  initialTagNames?: string[];
}

export function ItemForm({ mode, types, initialValues, defaultTypeId, collections, initialCollectionIds, userTags, initialTagNames }: ItemFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState(
    defaultTypeId ?? initialValues?.typeId ?? types[0]?.id ?? ""
  );
  const [contentValue, setContentValue] = useState(initialValues?.content ?? "");
  const [selectedLanguage, setSelectedLanguage] = useState(initialValues?.language ?? "");
  const [aiTagSuggestions, setAiTagSuggestions] = useState<string[]>([]);
  const [isTagsPending, startTagsTransition] = useTransition();
  const [tagsAiError, setTagsAiError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState<string | null>(initialValues?.fileUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(initialValues?.fileName ?? null);
  const [fileSize, setFileSize] = useState<number | null>(initialValues?.fileSize ?? null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fieldConfig = TYPE_FIELD_CONFIG[selectedTypeId] ?? {
    hasContent: false,
    hasLanguage: false,
    hasUrl: false,
    hasFile: false,
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setUploadError("File exceeds 25 MB limit");
      e.target.value = "";
      return;
    }
    if (selectedTypeId === "system_image" && !file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed for this type");
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setUploadState("uploading");
    setUploadProgress(0);

    if (selectedTypeId === "system_image") {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));
    }

    const data = new FormData();
    data.append("file", file);
    data.append("typeId", selectedTypeId);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          setFileKey(res.key);
          setFileName(res.fileName);
          setFileSize(res.fileSize);
          setUploadState("done");
        } else {
          setUploadError(res.error ?? `Upload failed (${xhr.status})`);
          setUploadState("error");
        }
      } catch {
        setUploadError(`Upload failed (${xhr.status})`);
        setUploadState("error");
      }
    };
    xhr.onerror = () => {
      setUploadError("Upload failed — network error");
      setUploadState("error");
    };
    xhr.open("POST", "/api/upload");
    xhr.send(data);
  }

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
          onChange={(typeId) => {
            setSelectedTypeId(typeId);
            if (mode === "create") setContentValue("");
          }}
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
          <label className="text-sm font-medium">Content</label>
          <input type="hidden" name="content" value={contentValue} readOnly />
          {CODE_TYPE_IDS.includes(selectedTypeId) ? (
            <CodeMirrorEditor
              value={contentValue}
              language={selectedLanguage}
              onChange={setContentValue}
            />
          ) : NOTE_TYPE_IDS.includes(selectedTypeId) ? (
            <TipTapEditor
              value={contentValue}
              onChange={setContentValue}
            />
          ) : (
            <textarea
              id="content"
              rows={10}
              value={contentValue}
              onChange={(e) => setContentValue(e.target.value)}
              placeholder="Paste your content here…"
              className={`${inputClass} resize-y font-mono`}
            />
          )}
        </div>
      )}

      {fieldConfig.hasLanguage && (
        <div className="space-y-1.5">
          <label htmlFor="language" className="text-sm font-medium">Language</label>
          <select
            id="language"
            name="language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
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

      {fieldConfig.hasFile && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            File {mode === "create" && <span className="text-destructive">*</span>}
          </label>

          {mode === "edit" && fileKey && uploadState === "idle" && (
            <p className="text-xs text-muted-foreground">
              Current file: <span className="font-mono">{fileName ?? fileKey}</span>
              {fileSize != null && ` (${formatBytes(fileSize)})`}
              {" — select a new file to replace it"}
            </p>
          )}

          <input
            type="file"
            accept={selectedTypeId === "system_image" ? "image/*" : undefined}
            onChange={handleFileChange}
            disabled={uploadState === "uploading"}
            className={`${inputClass} cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:text-foreground`}
          />

          {uploadState === "uploading" && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
            </div>
          )}

          {uploadState === "done" && imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="max-h-48 rounded-lg border border-border object-contain"
            />
          )}

          {uploadState === "done" && fileName && (
            <p className="text-xs text-green-500">
              {fileName}{fileSize != null && ` (${formatBytes(fileSize)})`} — ready
            </p>
          )}

          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}

          {fileKey && <input type="hidden" name="fileKey" value={fileKey} />}
          {fileName && <input type="hidden" name="fileName" value={fileName} />}
          {fileSize != null && <input type="hidden" name="fileSize" value={fileSize} />}
          {mode === "edit" && initialValues?.fileUrl && (
            <input type="hidden" name="oldFileKey" value={initialValues.fileUrl} />
          )}
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

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span />
          <button
            type="button"
            disabled={isTagsPending}
            onClick={() => {
              setTagsAiError(null);
              const titleEl = formRef.current?.elements.namedItem("title") as HTMLInputElement | null;
              const title = titleEl?.value ?? initialValues?.title ?? "";
              if (!title.trim()) return;
              startTagsTransition(async () => {
                const result = await suggestTagsFromContent({
                  title,
                  content: contentValue,
                  typeId: selectedTypeId,
                });
                if (result.success && result.data) {
                  setAiTagSuggestions(result.data);
                } else {
                  setTagsAiError(result.error ?? "Failed to suggest tags");
                }
              });
            }}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            {isTagsPending ? "Suggesting…" : "✨ Suggest tags"}
          </button>
        </div>
        <TagSelector
          userTags={userTags ?? []}
          initialTagNames={initialTagNames}
          suggestedTags={aiTagSuggestions}
          onSuggestionAccepted={(tag) =>
            setAiTagSuggestions((prev) => prev.filter((t) => t !== tag))
          }
        />
        {tagsAiError && <p className="text-xs text-destructive">{tagsAiError}</p>}
      </div>

      {collections && collections.length > 0 && (
        <CollectionSelector
          collections={collections}
          initialSelectedIds={initialCollectionIds}
        />
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || uploadState === "uploading"}>
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
