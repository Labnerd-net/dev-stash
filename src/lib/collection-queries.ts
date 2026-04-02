import { db } from "@/db";
import { collections, itemCollections, items, itemTypes } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { ItemWithType } from "@/lib/item-queries";

export async function getCollections(userId: string) {
  // Query 1: collections with item counts
  const rows = await db
    .select({
      collection: collections,
      itemCount: sql<number>`cast(count(${itemCollections.itemId}) as int)`,
    })
    .from(collections)
    .leftJoin(itemCollections, eq(itemCollections.collectionId, collections.id))
    .where(eq(collections.userId, userId))
    .groupBy(collections.id)
    .orderBy(desc(collections.updatedAt));

  if (rows.length === 0) return [];

  // Query 2: dominant type color per collection
  const collectionIds = rows.map((r) => r.collection.id);
  const colorRows = await db
    .select({
      collectionId: itemCollections.collectionId,
      color: itemTypes.color,
      cnt: sql<number>`cast(count(${itemCollections.itemId}) as int)`,
    })
    .from(itemCollections)
    .innerJoin(items, eq(items.id, itemCollections.itemId))
    .innerJoin(itemTypes, eq(itemTypes.id, items.typeId))
    .where(inArray(itemCollections.collectionId, collectionIds))
    .groupBy(itemCollections.collectionId, itemTypes.color)
    .orderBy(desc(sql`count(${itemCollections.itemId})`));

  // Pick first occurrence per collectionId (highest count)
  const dominantColorMap = new Map<string, string | null>();
  for (const row of colorRows) {
    if (!dominantColorMap.has(row.collectionId)) {
      dominantColorMap.set(row.collectionId, row.color);
    }
  }

  return rows.map((r) => ({
    ...r,
    dominantColor: dominantColorMap.get(r.collection.id) ?? null,
  }));
}

export type CollectionWithMeta = Awaited<ReturnType<typeof getCollections>>[number];

export async function getCollectionById(id: string, userId: string) {
  const rows = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, userId)));
  return rows[0] ?? null;
}

export async function getCollectionItems(
  collectionId: string,
  userId: string
): Promise<ItemWithType[]> {
  return db
    .select({ item: items, itemType: itemTypes })
    .from(itemCollections)
    .innerJoin(items, eq(items.id, itemCollections.itemId))
    .innerJoin(itemTypes, eq(itemTypes.id, items.typeId))
    .innerJoin(collections, eq(collections.id, itemCollections.collectionId))
    .where(
      and(
        eq(itemCollections.collectionId, collectionId),
        eq(collections.userId, userId)
      )
    )
    .orderBy(desc(itemCollections.addedAt));
}

export async function getLatestCollections(userId: string, limit = 10) {
  return db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(desc(collections.updatedAt))
    .limit(limit);
}

export async function getCollectionsForItem(itemId: string, userId: string) {
  return db
    .select({ id: collections.id, name: collections.name })
    .from(itemCollections)
    .innerJoin(collections, eq(collections.id, itemCollections.collectionId))
    .where(
      and(eq(itemCollections.itemId, itemId), eq(collections.userId, userId))
    );
}

export async function getAllCollectionsForUser(userId: string) {
  return db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(collections.name);
}

export async function getAllItemsMinimal(userId: string) {
  return db
    .select({
      id: items.id,
      title: items.title,
      typeId: items.typeId,
      typeColor: itemTypes.color,
    })
    .from(items)
    .innerJoin(itemTypes, eq(itemTypes.id, items.typeId))
    .where(eq(items.userId, userId))
    .orderBy(items.title);
}
