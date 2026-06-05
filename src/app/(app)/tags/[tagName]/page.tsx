import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getItemsByTag } from "@/lib/tag-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ITEM_TYPE_MAP } from "@/lib/item-type-map";
import { ItemList } from "@/components/items/ItemList";

const VALID_TYPE_IDS = new Set<string>(
  Object.values(ITEM_TYPE_MAP).map((v) => v.typeId)
);

interface TagPageProps {
  params: Promise<{ tagName: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { tagName } = await params;
  const { type } = await searchParams;
  const decodedName = decodeURIComponent(tagName);
  const typeId = type && VALID_TYPE_IDS.has(type) ? type : undefined;

  const itemList = await getItemsByTag(session.user.id, decodedName, typeId);
  const tagsMap = itemList.length
    ? await getTagsForItems(itemList.map((r) => r.item.id), session.user.id)
    : {};

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Tag
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{decodedName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {itemList.length} {itemList.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/tags/${encodeURIComponent(decodedName)}`}
          className={[
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            !typeId
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
          ].join(" ")}
        >
          All
        </Link>
        {Object.entries(ITEM_TYPE_MAP).map(([, { typeId: tid, label }]) => (
          <Link
            key={tid}
            href={`/tags/${encodeURIComponent(decodedName)}?type=${tid}`}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              typeId === tid
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </div>

      {itemList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No {typeId ? "items of this type" : "items"} tagged &ldquo;{decodedName}&rdquo;.
          </p>
        </div>
      ) : (
        <ItemList items={itemList} label={decodedName} tagsMap={tagsMap} />
      )}
    </div>
  );
}
