import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getCollectionById,
  getCollectionItems,
} from "@/lib/collection-queries";
import { ItemList } from "@/components/items/ItemList";
import { DeleteCollectionRedirect } from "@/components/collections/DeleteCollectionRedirect";
import { FavoriteCollectionButton } from "@/components/collections/FavoriteCollectionButton";
import { buttonVariants } from "@/lib/button-variants";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const [collection, collectionItems] = await Promise.all([
    getCollectionById(id, session.user.id),
    getCollectionItems(id, session.user.id),
  ]);

  if (!collection) notFound();

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
          <Link
            href={`/collections/${collection.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <DeleteCollectionRedirect id={collection.id} redirectTo="/collections" />
        </div>
      </div>

      <ItemList items={collectionItems} label="items" />

      <div className="text-xs text-muted-foreground">
        <Link href="/collections" className="hover:underline">
          ← Back to Collections
        </Link>
      </div>
    </div>
  );
}
