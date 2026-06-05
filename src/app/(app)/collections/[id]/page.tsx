import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getCollectionById,
  getCollectionItems,
} from "@/lib/collection-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ItemList } from "@/components/items/ItemList";
import { DeleteCollectionRedirect } from "@/components/collections/DeleteCollectionRedirect";
import { FavoriteCollectionButton } from "@/components/collections/FavoriteCollectionButton";
import { buttonVariants } from "@/lib/button-variants";
import { PAGE_SIZE } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [collection, raw] = await Promise.all([
    getCollectionById(id, session.user.id),
    getCollectionItems(id, session.user.id, { limit: PAGE_SIZE + 1, offset }),
  ]);

  if (!collection) notFound();

  const hasNextPage = raw.length > PAGE_SIZE;
  const collectionItems = hasNextPage ? raw.slice(0, PAGE_SIZE) : raw;
  const tagsMap = await getTagsForItems(collectionItems.map((r) => r.item.id), session.user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FavoriteCollectionButton collectionId={collection.id} isFavorite={collection.isFavorite} />
          <a
            href={`/api/export/collections/${collection.id}?format=json`}
            download
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            JSON
          </a>
          <a
            href={`/api/export/collections/${collection.id}?format=zip`}
            download
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Markdown
          </a>
          <Link
            href={`/collections/${collection.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <DeleteCollectionRedirect id={collection.id} redirectTo="/collections" />
        </div>
      </div>

      <ItemList items={collectionItems} label="items" tagsMap={tagsMap} />

      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between">
          {page > 1 ? (
            <Link
              href={page === 2 ? `/collections/${id}` : `/collections/${id}?page=${page - 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNextPage && (
            <Link
              href={`/collections/${id}?page=${page + 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <Link href="/collections" className="hover:underline">
          ← Back to Collections
        </Link>
      </div>
    </div>
  );
}
