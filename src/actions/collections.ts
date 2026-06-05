"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { collections, itemCollections, items } from "@/db/schema";
import {
  createCollectionSchema,
  updateCollectionSchema,
  deleteCollectionSchema,
} from "@/lib/collection-schemas";

type ActionResult = { success: boolean; data?: { id: string }; error?: string };

export async function createCollection(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = createCollectionSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, description } = parsed.data;
  const collectionItemIds = formData.getAll("collectionItemId") as string[];

  const id = crypto.randomUUID();

  await db.insert(collections).values({
    id,
    name,
    description: description ?? null,
    userId: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (collectionItemIds.length > 0) {
    const ownedItems = await db
      .select({ id: items.id })
      .from(items)
      .where(
        and(
          inArray(items.id, collectionItemIds),
          eq(items.userId, session.user.id)
        )
      );
    const safeItemIds = ownedItems.map((i) => i.id);
    if (safeItemIds.length > 0) {
      await db.insert(itemCollections).values(
        safeItemIds.map((itemId) => ({
          itemId,
          collectionId: id,
          addedAt: new Date(),
        }))
      );
    }
  }

  revalidatePath("/collections");
  return { success: true, data: { id } };
}

export async function updateCollection(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = updateCollectionSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, name, description } = parsed.data;
  const collectionItemIds = formData.getAll("collectionItemId") as string[];

  const updated = await db
    .update(collections)
    .set({ name, description: description ?? null, updatedAt: new Date() })
    .where(and(eq(collections.id, id), eq(collections.userId, session.user.id)))
    .returning({ id: collections.id });

  if (updated.length === 0) return { success: false, error: "Not found" };

  // Verify submitted items belong to the current user
  let safeItemIds: string[] = [];
  if (collectionItemIds.length > 0) {
    const ownedItems = await db
      .select({ id: items.id })
      .from(items)
      .where(
        and(
          inArray(items.id, collectionItemIds),
          eq(items.userId, session.user.id)
        )
      );
    safeItemIds = ownedItems.map((i) => i.id);
  }

  // Atomically replace all item memberships
  await db.transaction(async (tx) => {
    await tx
      .delete(itemCollections)
      .where(eq(itemCollections.collectionId, id));
    if (safeItemIds.length > 0) {
      await tx.insert(itemCollections).values(
        safeItemIds.map((itemId) => ({
          itemId,
          collectionId: id,
          addedAt: new Date(),
        }))
      );
    }
  });

  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
  return { success: true, data: { id } };
}

export async function deleteCollection(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = deleteCollectionSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id } = parsed.data;

  await db
    .delete(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, session.user.id)));

  revalidatePath("/collections");
  return { success: true };
}

export async function removeItemFromCollection(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const itemId = formData.get("itemId") as string;
  const collectionId = formData.get("collectionId") as string;

  if (!itemId || !collectionId) {
    return { success: false, error: "Missing itemId or collectionId" };
  }

  // Verify ownership of both the collection and the item
  const [ownedCollection, ownedItem] = await Promise.all([
    db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))),
    db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.userId, session.user.id))),
  ]);

  if (ownedCollection.length === 0 || ownedItem.length === 0) {
    return { success: false, error: "Not found" };
  }

  await db
    .delete(itemCollections)
    .where(
      and(
        eq(itemCollections.itemId, itemId),
        eq(itemCollections.collectionId, collectionId)
      )
    );

  revalidatePath(`/collections/${collectionId}`);
  revalidatePath(`/collections/${collectionId}/edit`);
  return { success: true };
}

export async function toggleItemCollection(
  itemId: string,
  collectionId: string
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const [ownedItem, ownedCollection] = await Promise.all([
    db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.userId, session.user.id))),
    db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))),
  ]);

  if (ownedItem.length === 0 || ownedCollection.length === 0) {
    return { success: false, error: "Not found" };
  }

  const existing = await db
    .select({ itemId: itemCollections.itemId })
    .from(itemCollections)
    .where(
      and(
        eq(itemCollections.itemId, itemId),
        eq(itemCollections.collectionId, collectionId)
      )
    );

  if (existing.length > 0) {
    await db
      .delete(itemCollections)
      .where(
        and(
          eq(itemCollections.itemId, itemId),
          eq(itemCollections.collectionId, collectionId)
        )
      );
  } else {
    await db
      .insert(itemCollections)
      .values({ itemId, collectionId, addedAt: new Date() });
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}
