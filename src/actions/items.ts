"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, itemCollections, collections, tags, itemTags } from "@/db/schema";
import {
  createItemSchema,
  updateItemSchema,
  deleteItemSchema,
} from "@/lib/item-schemas";
import { TYPE_ID_TO_SLUG } from "@/lib/item-type-map";

type ActionResult = { success: boolean; data?: { id: string }; error?: string };

function revalidateItemPaths(typeId: string) {
  revalidatePath("/");
  const slug = TYPE_ID_TO_SLUG[typeId];
  if (slug) revalidatePath(`/${slug}`);
}

function normalizeTagNames(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of raw) {
    const norm = name.trim().toLowerCase();
    if (norm && norm.length <= 50 && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}

async function upsertTags(names: string[], userId: string): Promise<string[]> {
  if (names.length === 0) return [];

  await db
    .insert(tags)
    .values(names.map((name) => ({ id: crypto.randomUUID(), name, userId })))
    .onConflictDoNothing();

  const rows = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, names)));

  const idMap = new Map(rows.map((t) => [t.name, t.id]));
  return names.map((n) => idMap.get(n)!);
}

async function getOwnedCollectionIds(
  collectionIds: string[],
  userId: string
): Promise<string[]> {
  if (collectionIds.length === 0) return [];
  const owned = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(inArray(collections.id, collectionIds), eq(collections.userId, userId))
    );
  return owned.map((c) => c.id);
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = createItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { title, typeId, content, url, description, language } = parsed.data;
  const id = crypto.randomUUID();

  const fileKey = formData.get("fileKey") as string | null;
  const rawFileName = formData.get("fileName") as string | null;
  const rawFileSize = formData.get("fileSize") as string | null;
  const isFileType = fileKey != null && fileKey.length > 0;

  await db.insert(items).values({
    id,
    title,
    typeId,
    content: content ?? null,
    url: url || null,
    description: description ?? null,
    language: language ?? null,
    contentType: isFileType ? "file" : "text",
    fileUrl: isFileType ? fileKey : null,
    fileName: isFileType ? rawFileName : null,
    fileSize: isFileType && rawFileSize ? parseInt(rawFileSize, 10) : null,
    userId: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const rawCollectionIds = formData.getAll("collectionId") as string[];
  const ownedCollectionIds = await getOwnedCollectionIds(
    rawCollectionIds,
    session.user.id
  );
  if (ownedCollectionIds.length > 0) {
    await db.insert(itemCollections).values(
      ownedCollectionIds.map((collectionId) => ({
        itemId: id,
        collectionId,
        addedAt: new Date(),
      }))
    );
    for (const collectionId of ownedCollectionIds) {
      revalidatePath(`/collections/${collectionId}`);
    }
  }

  const tagNames = normalizeTagNames(formData.getAll("tagName") as string[]);
  const tagIds = await upsertTags(tagNames, session.user.id);
  if (tagIds.length > 0) {
    await db
      .insert(itemTags)
      .values(tagIds.map((tagId) => ({ itemId: id, tagId })));
  }

  revalidateItemPaths(typeId);
  revalidatePath("/collections");
  return { success: true, data: { id } };
}

export async function updateItem(formData: FormData): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = updateItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, title, typeId, content, url, description, language } = parsed.data;

  const newFileKey = formData.get("fileKey") as string | null;
  const oldFileKey = formData.get("oldFileKey") as string | null;
  const rawFileName = formData.get("fileName") as string | null;
  const rawFileSize = formData.get("fileSize") as string | null;
  const replacingFile = newFileKey != null && newFileKey.length > 0;

  const fileUpdateFields = replacingFile
    ? {
        contentType: "file" as const,
        fileUrl: newFileKey,
        fileName: rawFileName,
        fileSize: rawFileSize ? parseInt(rawFileSize, 10) : null,
      }
    : {};

  const updated = await db
    .update(items)
    .set({
      title,
      typeId,
      content: content ?? null,
      url: url || null,
      description: description ?? null,
      language: language ?? null,
      ...fileUpdateFields,
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)))
    .returning({ id: items.id });

  if (updated.length === 0) return { success: false, error: "Not found" };

  if (replacingFile && oldFileKey && oldFileKey.length > 0 && oldFileKey !== newFileKey) {
    try {
      const { env } = getCloudflareContext();
      await env.dev_stash_files.delete(oldFileKey);
    } catch {
      // R2 delete failure is non-fatal; item is already updated
    }
  }

  const hasCollectionSelector =
    formData.get("hasCollectionSelector") === "1";
  if (hasCollectionSelector) {
    const rawCollectionIds = formData.getAll("collectionId") as string[];
    const ownedCollectionIds = await getOwnedCollectionIds(
      rawCollectionIds,
      session.user.id
    );
    await db.delete(itemCollections).where(eq(itemCollections.itemId, id));
    if (ownedCollectionIds.length > 0) {
      await db.insert(itemCollections).values(
        ownedCollectionIds.map((collectionId) => ({
          itemId: id,
          collectionId,
          addedAt: new Date(),
        }))
      );
    }
    revalidatePath("/collections", "layout");
  }

  const hasTagSelector = formData.get("hasTagSelector") === "1";
  if (hasTagSelector) {
    const tagNames = normalizeTagNames(formData.getAll("tagName") as string[]);
    const tagIds = await upsertTags(tagNames, session.user.id);
    await db.delete(itemTags).where(eq(itemTags.itemId, id));
    if (tagIds.length > 0) {
      await db
        .insert(itemTags)
        .values(tagIds.map((tagId) => ({ itemId: id, tagId })));
    }
  }

  revalidateItemPaths(typeId);
  revalidatePath(`/items/${id}`);
  return { success: true, data: { id } };
}

export async function deleteItem(formData: FormData): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = deleteItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id } = parsed.data;

  const existing = await db
    .select({ fileUrl: items.fileUrl })
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)));

  await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)));

  const fileKey = existing[0]?.fileUrl;
  if (fileKey) {
    try {
      const { env } = getCloudflareContext();
      await env.dev_stash_files.delete(fileKey);
    } catch {
      // R2 delete failure is non-fatal; item is already deleted
    }
  }

  revalidatePath("/");
  return { success: true };
}
