"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, collections } from "@/db/schema";
import { TYPE_ID_TO_SLUG } from "@/lib/item-type-map";

type ActionResult = { success: boolean; error?: string };

export async function toggleItemFavorite(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const updated = await db
    .update(items)
    .set({ isFavorite: sql`NOT ${items.isFavorite}`, updatedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)))
    .returning({ typeId: items.typeId });

  if (updated.length === 0) return { success: false, error: "Not found" };

  const slug = TYPE_ID_TO_SLUG[updated[0].typeId];
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/favorites");
  return { success: true };
}

export async function toggleItemPin(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const updated = await db
    .update(items)
    .set({ isPinned: sql`NOT ${items.isPinned}`, updatedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)))
    .returning({ typeId: items.typeId });

  if (updated.length === 0) return { success: false, error: "Not found" };

  const slug = TYPE_ID_TO_SLUG[updated[0].typeId];
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath(`/items/${itemId}`);
  return { success: true };
}

export async function toggleCollectionFavorite(collectionId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const updated = await db
    .update(collections)
    .set({ isFavorite: sql`NOT ${collections.isFavorite}`, updatedAt: new Date() })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)))
    .returning({ id: collections.id });

  if (updated.length === 0) return { success: false, error: "Not found" };

  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}
