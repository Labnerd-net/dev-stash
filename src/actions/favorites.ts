"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, collections } from "@/db/schema";
import { TYPE_ID_TO_SLUG } from "@/lib/item-type-map";

type ActionResult = { success: boolean; error?: string };

export async function toggleItemFavorite(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const rows = await db
    .select({ isFavorite: items.isFavorite, typeId: items.typeId })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)));

  if (rows.length === 0) return { success: false, error: "Not found" };

  await db
    .update(items)
    .set({ isFavorite: !rows[0].isFavorite, updatedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)));

  const slug = TYPE_ID_TO_SLUG[rows[0].typeId];
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/favorites");
  return { success: true };
}

export async function toggleItemPin(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const rows = await db
    .select({ isPinned: items.isPinned, typeId: items.typeId })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)));

  if (rows.length === 0) return { success: false, error: "Not found" };

  await db
    .update(items)
    .set({ isPinned: !rows[0].isPinned, updatedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)));

  const slug = TYPE_ID_TO_SLUG[rows[0].typeId];
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath(`/items/${itemId}`);
  return { success: true };
}

export async function toggleCollectionFavorite(collectionId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const rows = await db
    .select({ isFavorite: collections.isFavorite })
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)));

  if (rows.length === 0) return { success: false, error: "Not found" };

  await db
    .update(collections)
    .set({ isFavorite: !rows[0].isFavorite, updatedAt: new Date() })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)));

  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}
