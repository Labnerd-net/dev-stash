import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getItemById } from "@/lib/item-queries";
import { getCollectionsForItem } from "@/lib/collection-queries";
import { TYPE_ID_TO_SLUG, TYPE_FIELD_CONFIG, ITEM_TYPE_MAP } from "@/lib/item-type-map";
import { buttonVariants } from "@/lib/button-variants";
import { DeleteItemRedirect } from "@/components/items/DeleteItemRedirect";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const [row, itemCollectionsList] = await Promise.all([
    getItemById(id, session.user.id),
    getCollectionsForItem(id, session.user.id),
  ]);
  if (!row) notFound();

  const { item, itemType } = row;
  const fieldConfig = TYPE_FIELD_CONFIG[item.typeId] ?? { hasContent: false, hasLanguage: false, hasUrl: false };
  const typeSlug = TYPE_ID_TO_SLUG[item.typeId] ?? "/";
  const typeLabel = Object.values(ITEM_TYPE_MAP).find((v) => v.typeId === item.typeId)?.label ?? `${itemType.name}s`;

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
          <pre className="rounded-lg border border-border bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
            {item.content}
          </pre>
        </div>
      )}

      {itemCollectionsList.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Collections
          </p>
          <div className="flex flex-wrap gap-1.5">
            {itemCollectionsList.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <Link href={`/${typeSlug}`} className="hover:underline">
          ← Back to {typeLabel}
        </Link>
      </div>
    </div>
  );
}
