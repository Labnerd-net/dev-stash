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
import { sanitizeHtml } from "@/lib/html-utils";
import { getItemById } from "@/lib/item-queries";

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

  const { title, typeId, url, description, language } = parsed.data;
  const content =
    typeId === "system_note" && parsed.data.content
      ? sanitizeHtml(parsed.data.content)
      : (parsed.data.content ?? null);
  const id = crypto.randomUUID();

  const fileKey = formData.get("fileKey") as string | null;
  const rawFileName = formData.get("fileName") as string | null;
  const rawFileSize = formData.get("fileSize") as string | null;
  const isFileType = fileKey != null && fileKey.length > 0;

  if (isFileType && !fileKey!.startsWith(`uploads/${session.user.id}/`)) {
    return { success: false, error: "Invalid file key" };
  }
  if (isFileType) {
    const { env } = getCloudflareContext();
    const r2Obj = await env.dev_stash_files.head(fileKey!);
    if (!r2Obj) return { success: false, error: "File not found — please re-upload" };
  }

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
    fileSize: isFileType && rawFileSize ? (isNaN(parseInt(rawFileSize, 10)) ? null : parseInt(rawFileSize, 10)) : null,
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

  const { id, title, typeId, url, description, language } = parsed.data;
  const content =
    typeId === "system_note" && parsed.data.content
      ? sanitizeHtml(parsed.data.content)
      : (parsed.data.content ?? null);

  const newFileKey = formData.get("fileKey") as string | null;
  const oldFileKey = formData.get("oldFileKey") as string | null;
  const rawFileName = formData.get("fileName") as string | null;
  const rawFileSize = formData.get("fileSize") as string | null;
  const replacingFile = newFileKey != null && newFileKey.length > 0;

  const expectedPrefix = `uploads/${session.user.id}/`;
  if (replacingFile && !newFileKey!.startsWith(expectedPrefix)) {
    return { success: false, error: "Invalid file key" };
  }
  if (replacingFile) {
    const { env } = getCloudflareContext();
    const r2Obj = await env.dev_stash_files.head(newFileKey!);
    if (!r2Obj) return { success: false, error: "File not found — please re-upload" };
  }
  if (oldFileKey && oldFileKey.length > 0 && !oldFileKey.startsWith(expectedPrefix)) {
    return { success: false, error: "Invalid file key" };
  }

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

  await db
    .update(items)
    .set({ deletedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)));

  revalidatePath("/");
  return { success: true };
}

type BulkResult = { success: boolean; error?: string };

export async function bulkFavoriteItems(ids: string[], isFavorite: boolean): Promise<BulkResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };
  if (ids.length === 0) return { success: true };

  await db
    .update(items)
    .set({ isFavorite, updatedAt: new Date() })
    .where(and(inArray(items.id, ids), eq(items.userId, session.user.id)));

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkPinItems(ids: string[], isPinned: boolean): Promise<BulkResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };
  if (ids.length === 0) return { success: true };

  await db
    .update(items)
    .set({ isPinned, updatedAt: new Date() })
    .where(and(inArray(items.id, ids), eq(items.userId, session.user.id)));

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkDeleteItems(ids: string[]): Promise<BulkResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };
  if (ids.length === 0) return { success: true };

  await db
    .update(items)
    .set({ deletedAt: new Date() })
    .where(and(inArray(items.id, ids), eq(items.userId, session.user.id)));

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkAddToCollection(
  itemIds: string[],
  collectionId: string
): Promise<BulkResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };
  if (itemIds.length === 0 || !collectionId) return { success: true };

  const ownedCollection = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)));
  if (ownedCollection.length === 0) return { success: false, error: "Collection not found" };

  const ownedItems = await db
    .select({ id: items.id })
    .from(items)
    .where(and(inArray(items.id, itemIds), eq(items.userId, session.user.id)));

  if (ownedItems.length > 0) {
    await db
      .insert(itemCollections)
      .values(ownedItems.map(({ id }) => ({ itemId: id, collectionId, addedAt: new Date() })))
      .onConflictDoNothing();
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkAddTag(itemIds: string[], tagName: string): Promise<BulkResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };
  if (itemIds.length === 0 || !tagName.trim()) return { success: true };

  const [normalizedName] = normalizeTagNames([tagName]);
  if (!normalizedName) return { success: false, error: "Invalid tag name" };

  const ownedItems = await db
    .select({ id: items.id })
    .from(items)
    .where(and(inArray(items.id, itemIds), eq(items.userId, session.user.id)));

  if (ownedItems.length === 0) return { success: true };

  const tagIds = await upsertTags([normalizedName], session.user.id);
  const tagId = tagIds[0];
  if (!tagId) return { success: false, error: "Failed to create tag" };

  await db
    .insert(itemTags)
    .values(ownedItems.map(({ id }) => ({ itemId: id, tagId })))
    .onConflictDoNothing();

  revalidatePath("/", "layout");
  return { success: true };
}

export async function duplicateItem(itemId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const row = await getItemById(itemId, session.user.id);
  if (!row) return { success: false, error: "Not found" };
  const { item } = row;

  const existingTags = await db
    .select({ tagId: itemTags.tagId })
    .from(itemTags)
    .where(eq(itemTags.itemId, itemId));

  const newId = crypto.randomUUID();
  await db.insert(items).values({
    id: newId,
    title: `Copy of ${item.title}`,
    typeId: item.typeId,
    contentType: "text",
    content: item.content,
    url: item.url,
    description: item.description,
    language: item.language,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    isFavorite: false,
    isPinned: false,
    userId: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (existingTags.length > 0) {
    await db.insert(itemTags).values(
      existingTags.map(({ tagId }) => ({ itemId: newId, tagId }))
    );
  }

  revalidateItemPaths(item.typeId);
  return { success: true, data: { id: newId } };
}
