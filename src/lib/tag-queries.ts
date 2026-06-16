import { db } from "@/db";
import { tags, itemTags, items, itemTypes } from "@/db/schema";
import { eq, and, inArray, desc, sql, isNull } from "drizzle-orm";

export async function getTagsWithItemCounts(userId: string, limit?: number) {
  const rows = await db
    .select({
      name: tags.name,
      count: sql<number>`cast(count(${itemTags.itemId}) as int)`,
    })
    .from(tags)
    .leftJoin(itemTags, eq(itemTags.tagId, tags.id))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id, tags.name)
    .orderBy(desc(sql`count(${itemTags.itemId})`));
  return limit ? rows.slice(0, limit) : rows;
}

export async function getItemsByTag(
  userId: string,
  tagName: string,
  typeId?: string
) {
  return db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .innerJoin(itemTags, eq(itemTags.itemId, items.id))
    .innerJoin(tags, eq(tags.id, itemTags.tagId))
    .where(
      and(
        eq(items.userId, userId),
        isNull(items.deletedAt),
        eq(tags.name, tagName),
        typeId ? eq(items.typeId, typeId) : undefined
      )
    )
    .orderBy(desc(items.isPinned), desc(items.createdAt));
}

export async function getUserTags(userId: string) {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.name);
}

export async function getTagsForItem(
  itemId: string,
  userId: string
): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(and(eq(itemTags.itemId, itemId), eq(tags.userId, userId)));
  return rows.map((r) => r.name);
}

export async function getTagsForItems(
  itemIds: string[],
  userId: string
): Promise<Record<string, string[]>> {
  if (itemIds.length === 0) return {};
  const rows = await db
    .select({ itemId: itemTags.itemId, name: tags.name })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(and(inArray(itemTags.itemId, itemIds), eq(tags.userId, userId)));

  const map: Record<string, string[]> = {};
  for (const row of rows) {
    (map[row.itemId] ??= []).push(row.name);
  }
  return map;
}
