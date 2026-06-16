import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getCollectionById,
  getCollectionItems,
  getAllItemsMinimal,
} from "@/lib/collection-queries";
import { CollectionForm } from "@/components/collections/CollectionForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const [collection, collectionItems, allItems] = await Promise.all([
    getCollectionById(id, session.user.id),
    getCollectionItems(id, session.user.id),
    getAllItemsMinimal(session.user.id),
  ]);

  if (!collection) notFound();

  const currentItemIds = collectionItems.map((r) => r.item.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Collection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your collection&apos;s details.
        </p>
      </div>
      <Link
        href={`/collections/${id}`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to {collection.name}
      </Link>
      <CollectionForm
        mode="edit"
        allItems={allItems}
        initialValues={{
          id: collection.id,
          name: collection.name,
          description: collection.description ?? undefined,
        }}
        currentItemIds={currentItemIds}
      />
    </div>
  );
}
