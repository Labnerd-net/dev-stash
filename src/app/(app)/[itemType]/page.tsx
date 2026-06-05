import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getItemsByType } from "@/lib/item-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ITEM_TYPE_MAP } from "@/lib/item-type-map";
import { ItemList } from "@/components/items/ItemList";
import { buttonVariants } from "@/lib/button-variants";
import { PAGE_SIZE } from "@/lib/constants";

export default async function ItemTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ itemType: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { itemType } = await params;
  const typeConfig = ITEM_TYPE_MAP[itemType as keyof typeof ITEM_TYPE_MAP];
  if (!typeConfig) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { typeId, label, singularLabel } = typeConfig;
  const raw = await getItemsByType(session.user.id, typeId, {
    limit: PAGE_SIZE + 1,
    offset,
  });

  const hasNextPage = raw.length > PAGE_SIZE;
  const itemList = hasNextPage ? raw.slice(0, PAGE_SIZE) : raw;
  const tagsMap = await getTagsForItems(itemList.map((r) => r.item.id), session.user.id);

  const subtitle =
    page === 1 && !hasNextPage
      ? `${itemList.length} ${itemList.length === 1 ? singularLabel.toLowerCase() : label.toLowerCase()}`
      : `Page ${page}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Link href="/items/new" className={buttonVariants({ size: "sm" })}>
          New {singularLabel}
        </Link>
      </div>
      <ItemList items={itemList} label={label} tagsMap={tagsMap} />
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={page === 2 ? `/${itemType}` : `/${itemType}?page=${page - 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNextPage && (
            <Link
              href={`/${itemType}?page=${page + 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
