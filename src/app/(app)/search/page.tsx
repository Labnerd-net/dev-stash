import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { searchItems } from "@/lib/item-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ITEM_TYPE_MAP } from "@/lib/item-type-map";
import { ItemRow } from "@/components/items/ItemRow";

const VALID_TYPE_IDS = new Set<string>(
  Object.values(ITEM_TYPE_MAP).map((v) => v.typeId)
);

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { q, type } = await searchParams;
  const query = q?.trim() ?? "";
  const typeId = type && VALID_TYPE_IDS.has(type) ? type : undefined;

  const results = query
    ? await searchItems(session.user.id, query, typeId)
    : [];

  const tagsMap = results.length
    ? await getTagsForItems(results.map((r) => r.item.id), session.user.id)
    : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        {query && (
          <p className="text-sm text-muted-foreground mt-1">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {/* Type filter chips */}
      {query && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
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
              href={`/search?q=${encodeURIComponent(query)}&type=${tid}`}
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
      )}

      {/* Results */}
      {!query ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Enter a search term above to find your items.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No items found for &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {results.map((row) => (
            <ItemRow key={row.item.id} row={row} tags={tagsMap[row.item.id]} />
          ))}
        </ul>
      )}
    </div>
  );
}
