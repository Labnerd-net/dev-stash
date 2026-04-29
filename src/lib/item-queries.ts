import { db } from "@/db";
import { items, itemTypes } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export async function getItemsByType(userId: string, typeId: string) {
  return db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), eq(items.typeId, typeId)))
    .orderBy(desc(items.createdAt));
}

export async function getItemById(id: string, userId: string) {
  const rows = await db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.id, id), eq(items.userId, userId)));
  return rows[0] ?? null;
}

export type ItemWithType = Awaited<ReturnType<typeof getItemsByType>>[number];

export async function searchItems(
  userId: string,
  query: string,
  typeId?: string
): Promise<ItemWithType[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const likePattern = `%${trimmed}%`;

  const textMatch =
    trimmed.length <= 2
      ? sql`${items.title} ILIKE ${likePattern}`
      : sql`to_tsvector('english', coalesce(${items.title},'') || ' ' || coalesce(${items.content},'') || ' ' || coalesce(${items.description},'')) @@ websearch_to_tsquery('english', ${trimmed})`;

  const tagMatch = sql`EXISTS (
    SELECT 1 FROM "item_tags" it
    JOIN "tags" t ON it.tag_id = t.id
    WHERE it.item_id = ${items.id}
    AND t.user_id = ${userId}
    AND t.name ILIKE ${likePattern}
  )`;

  return db
    .selectDistinct({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(
      and(
        eq(items.userId, userId),
        typeId ? eq(items.typeId, typeId) : undefined,
        or(textMatch, tagMatch)
      )
    )
    .orderBy(desc(items.createdAt))
    .limit(50);
}
