import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getItemById, getItemIdsByType } from "@/lib/item-queries";
import { getCollectionsForItem, getAllCollectionsForUser } from "@/lib/collection-queries";
import { getTagsForItem } from "@/lib/tag-queries";
import { TYPE_ID_TO_SLUG, TYPE_FIELD_CONFIG, ITEM_TYPE_MAP } from "@/lib/item-type-map";
import { highlightCode } from "@/lib/shiki";
import { buttonVariants } from "@/lib/button-variants";
import { DeleteItemRedirect } from "@/components/items/DeleteItemRedirect";
import { FavoriteItemButton } from "@/components/items/FavoriteItemButton";
import { PinItemButton } from "@/components/items/PinItemButton";
import { CopyButton } from "@/components/items/CopyButton";
import { recordItemView } from "@/lib/recently-used-queries";
import { AiCodeExplainer } from "@/components/items/AiCodeExplainer";
import { AiSummary } from "@/components/items/AiSummary";
import { AiPromptOptimizer } from "@/components/items/AiPromptOptimizer";
import { TextFilePreview } from "@/components/items/TextFilePreview";
import { DuplicateItemButton } from "@/components/items/DuplicateItemButton";
import { QuickCollectionPicker } from "@/components/items/QuickCollectionPicker";
import { isTextFile } from "@/lib/text-file";

const CODE_TYPE_IDS = new Set(["system_snippet", "system_command", "system_prompt"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const [row, itemCollectionsList, itemTagNames, allCollections] = await Promise.all([
    getItemById(id, session.user.id),
    getCollectionsForItem(id, session.user.id),
    getTagsForItem(id, session.user.id),
    getAllCollectionsForUser(session.user.id),
  ]);
  if (!row) notFound();
  void recordItemView(session.user.id, row.item.id).catch(() => {});

  const siblingIds = await getItemIdsByType(session.user.id, row.item.typeId);
  const currentIndex = siblingIds.indexOf(id);
  const prevId = currentIndex > 0 ? siblingIds[currentIndex - 1] : null;
  const nextId = currentIndex < siblingIds.length - 1 ? siblingIds[currentIndex + 1] : null;

  const { item, itemType } = row;
  const fieldConfig = TYPE_FIELD_CONFIG[item.typeId] ?? { hasContent: false, hasLanguage: false, hasUrl: false };
  const typeSlug = TYPE_ID_TO_SLUG[item.typeId] ?? "/";
  const typeLabel = Object.values(ITEM_TYPE_MAP).find((v) => v.typeId === item.typeId)?.label ?? `${itemType.name}s`;

  const copyContent = (() => {
    if (item.typeId === "system_url") return item.url ?? null;
    if (fieldConfig.hasContent) return item.content ?? null;
    return null;
  })();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: itemType.color ?? "#888" }}
            />
            <span className="text-xs text-muted-foreground">{itemType.name}</span>
            {item.language && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
                {item.language}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyButton content={copyContent} />
          <FavoriteItemButton itemId={item.id} isFavorite={item.isFavorite} />
          <PinItemButton itemId={item.id} isPinned={item.isPinned} />
          <DuplicateItemButton itemId={item.id} />
          <Link
            href={`/items/${item.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <DeleteItemRedirect id={item.id} redirectTo={`/${typeSlug}`} />
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}

      {fieldConfig.hasUrl && item.url && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {item.url}
          </a>
        </div>
      )}

      {fieldConfig.hasContent && item.content && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</p>
          {item.typeId === "system_note" ? (
            <div
              className="prose prose-sm prose-invert max-w-none rounded-lg border border-border bg-muted p-4"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : CODE_TYPE_IDS.has(item.typeId) ? (
            <div
              className="line-numbers overflow-hidden rounded-lg border border-border text-sm"
              dangerouslySetInnerHTML={{ __html: await highlightCode(item.content, item.language) }}
            />
          ) : (
            <pre className="rounded-lg border border-border bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
              {item.content}
            </pre>
          )}
        </div>
      )}

      {fieldConfig.hasFile && item.fileUrl && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">File</p>
          {item.typeId === "system_image" ? (
            <div className="space-y-2">
              <img
                src={`/api/files/${item.id}`}
                alt={item.fileName ?? item.title}
                className="max-w-full rounded-lg border border-border"
              />
              <a
                href={`/api/files/${item.id}`}
                download={item.fileName ?? true}
                className="text-sm text-primary hover:underline"
              >
                Download {item.fileName ?? "image"}
                {item.fileSize != null && ` (${formatBytes(item.fileSize)})`}
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.fileName ?? "File"}</p>
                  {item.fileSize != null && (
                    <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
                  )}
                </div>
                <a
                  href={`/api/files/${item.id}`}
                  download={item.fileName ?? true}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Download
                </a>
              </div>
              {isTextFile(item.fileName) && (
                <TextFilePreview itemId={item.id} fileName={item.fileName ?? "file"} />
              )}
            </div>
          )}
        </div>
      )}

      {(item.typeId === "system_snippet" || item.typeId === "system_command") && (
        <AiCodeExplainer itemId={item.id} />
      )}
      {item.typeId === "system_note" && (
        <AiSummary itemId={item.id} />
      )}
      {item.typeId === "system_prompt" && (
        <>
          <AiSummary itemId={item.id} />
          <AiPromptOptimizer itemId={item.id} />
        </>
      )}

      {itemTagNames.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {itemTagNames.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <QuickCollectionPicker
        itemId={item.id}
        allCollections={allCollections}
        currentCollections={itemCollectionsList}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link href={`/${typeSlug}`} className="hover:underline">
          ← Back to {typeLabel}
        </Link>
        {(prevId || nextId) && (
          <div className="flex items-center gap-3">
            {prevId ? (
              <Link href={`/items/${prevId}`} className="hover:underline">← Prev</Link>
            ) : (
              <span className="opacity-30">← Prev</span>
            )}
            {nextId ? (
              <Link href={`/items/${nextId}`} className="hover:underline">Next →</Link>
            ) : (
              <span className="opacity-30">Next →</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
