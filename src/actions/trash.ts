"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, isNotNull, lt } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, collections } from "@/db/schema";
import { TYPE_ID_TO_SLUG } from "@/lib/item-type-map";

type ActionResult = { success: boolean; error?: string };

export async function restoreItem(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const updated = await db
    .update(items)
    .set({ deletedAt: null })
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)))
    .returning({ typeId: items.typeId });

  if (updated.length === 0) return { success: false, error: "Not found" };

  const slug = TYPE_ID_TO_SLUG[updated[0].typeId] ?? null;
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath("/");
  revalidatePath("/trash");
  return { success: true };
}

export async function restoreCollection(collectionId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  await db
    .update(collections)
    .set({ deletedAt: null })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)));

  revalidatePath("/collections");
  revalidatePath("/trash");
  return { success: true };
}

export async function permanentDeleteItem(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const rows = await db
    .delete(items)
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)))
    .returning({ fileUrl: items.fileUrl });

  const fileKey = rows[0]?.fileUrl;
  if (fileKey) {
    try {
      const { env } = getCloudflareContext();
      await env.dev_stash_files.delete(fileKey);
    } catch {
      // R2 failure is non-fatal
    }
  }

  revalidatePath("/trash");
  return { success: true };
}

export async function permanentDeleteCollection(collectionId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  await db
    .delete(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)));

  revalidatePath("/trash");
  return { success: true };
}

export async function emptyTrash(): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const fileItems = await db
    .select({ fileUrl: items.fileUrl })
    .from(items)
    .where(and(eq(items.userId, userId), isNotNull(items.deletedAt)));

  const fileKeys = fileItems.map((r) => r.fileUrl).filter(Boolean) as string[];
  if (fileKeys.length > 0) {
    try {
      const { env } = getCloudflareContext();
      await Promise.all(fileKeys.map((key) => env.dev_stash_files.delete(key)));
    } catch {
      // R2 failure is non-fatal
    }
  }

  await db.delete(items).where(and(eq(items.userId, userId), isNotNull(items.deletedAt)));
  await db.delete(collections).where(and(eq(collections.userId, userId), isNotNull(collections.deletedAt)));

  revalidatePath("/trash");
  return { success: true };
}

export async function purgeExpiredTrash(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const expiredItems = await db
    .select({ id: items.id, fileUrl: items.fileUrl })
    .from(items)
    .where(and(eq(items.userId, userId), isNotNull(items.deletedAt), lt(items.deletedAt, thirtyDaysAgo)));

  if (expiredItems.length > 0) {
    const fileKeys = expiredItems.map((r) => r.fileUrl).filter(Boolean) as string[];
    if (fileKeys.length > 0) {
      try {
        const { env } = getCloudflareContext();
        await Promise.all(fileKeys.map((key) => env.dev_stash_files.delete(key)));
      } catch {
        // R2 failure is non-fatal
      }
    }
    await db.delete(items).where(and(eq(items.userId, userId), isNotNull(items.deletedAt), lt(items.deletedAt, thirtyDaysAgo)));
  }

  await db
    .delete(collections)
    .where(and(eq(collections.userId, userId), isNotNull(collections.deletedAt), lt(collections.deletedAt, thirtyDaysAgo)));
}
