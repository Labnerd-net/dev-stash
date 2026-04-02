import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { or, isNull, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { itemTypes } from "@/db/schema";
import { getItemById } from "@/lib/item-queries";
import { ItemForm } from "@/components/items/ItemForm";
import {
  getAllCollectionsForUser,
  getCollectionsForItem,
} from "@/lib/collection-queries";
import { getUserTags, getTagsForItem } from "@/lib/tag-queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const [row, types, userCollections, itemCollectionsList, userTags, itemTagNames] = await Promise.all([
    getItemById(id, session.user.id),
    db
      .select()
      .from(itemTypes)
      .where(or(isNull(itemTypes.userId), eq(itemTypes.userId, session.user.id))),
    getAllCollectionsForUser(session.user.id),
    getCollectionsForItem(id, session.user.id),
    getUserTags(session.user.id),
    getTagsForItem(id, session.user.id),
  ]);

  if (!row) notFound();

  const { item } = row;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Item</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your item&apos;s details.
        </p>
      </div>
      <ItemForm
        mode="edit"
        types={types}
        defaultTypeId={item.typeId}
        initialValues={{
          id: item.id,
          title: item.title,
          typeId: item.typeId,
          content: item.content ?? undefined,
          url: item.url ?? undefined,
          description: item.description ?? undefined,
          language: item.language ?? undefined,
        }}
        collections={userCollections}
        initialCollectionIds={itemCollectionsList.map((c) => c.id)}
        userTags={userTags}
        initialTagNames={itemTagNames}
      />
    </div>
  );
}
