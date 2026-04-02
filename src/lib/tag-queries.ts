import { db } from "@/db";
import { tags, itemTags } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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
