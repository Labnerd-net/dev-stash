import { db } from "@/db";
import { items, itemTypes } from "@/db/schema";
import { eq, and, or, desc, sql, inArray, isNull, isNotNull, ne } from "drizzle-orm";
import { SEARCH_RESULT_LIMIT } from "@/lib/constants";

export type ItemWithType = {
  item: typeof items.$inferSelect;
  itemType: typeof itemTypes.$inferSelect;
};

export async function getItemsByType(
  userId: string,
  typeId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<ItemWithType[]> {
  const base = db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), eq(items.typeId, typeId), isNull(items.deletedAt)))
    .orderBy(desc(items.isPinned), desc(items.createdAt));
  const { limit, offset } = opts;
  if (limit !== undefined) return base.limit(limit).offset(offset ?? 0);
  return base;
}

export async function getAdjacentItemIds(
  userId: string,
  typeId: string,
  itemId: string
): Promise<{ prevId: string | null; nextId: string | null }> {
  const result = await db.execute(sql`
    WITH ranked AS (
      SELECT
        id,
        LAG(id)  OVER (ORDER BY is_pinned DESC, created_at DESC) AS prev_id,
        LEAD(id) OVER (ORDER BY is_pinned DESC, created_at DESC) AS next_id
      FROM items
      WHERE user_id = ${userId}
        AND type_id = ${typeId}
        AND deleted_at IS NULL
    )
    SELECT prev_id, next_id FROM ranked WHERE id = ${itemId}
  `);
  const row = result.rows[0] as { prev_id: string | null; next_id: string | null } | undefined;
  return { prevId: row?.prev_id ?? null, nextId: row?.next_id ?? null };
}

export async function getFavoriteItems(userId: string) {
  return db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), eq(items.isFavorite, true), isNull(items.deletedAt)))
    .orderBy(desc(items.createdAt));
}

export async function getItemById(id: string, userId: string) {
  const rows = await db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.id, id), eq(items.userId, userId), isNull(items.deletedAt)));
  return rows[0] ?? null;
}

export async function getItemsByIds(userId: string, ids: string[]): Promise<ItemWithType[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), inArray(items.id, ids), isNull(items.deletedAt)));
  const indexMap = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => (indexMap.get(a.item.id) ?? 0) - (indexMap.get(b.item.id) ?? 0));
}

export async function getAllItemsForExport(userId: string) {
  return db
    .select({
      item: items,
      typeName: itemTypes.name,
    })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), isNull(items.deletedAt)))
    .orderBy(desc(items.createdAt));
}

export type ItemForExport = Awaited<ReturnType<typeof getAllItemsForExport>>[number];

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
      : sql`to_tsvector('english', coalesce(${items.title},'') || ' ' || coalesce(${items.content},'') || ' ' || coalesce(${items.description},'') || ' ' || coalesce(${items.language},'')) @@ websearch_to_tsquery('english', ${trimmed})`;

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
        isNull(items.deletedAt),
        typeId ? eq(items.typeId, typeId) : undefined,
        or(textMatch, tagMatch)
      )
    )
    .orderBy(desc(items.createdAt))
    .limit(SEARCH_RESULT_LIMIT);
}

export async function getRelatedItems(
  itemId: string,
  userId: string,
  limit = 5
): Promise<ItemWithType[]> {
  return db
    .selectDistinct({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(
      and(
        eq(items.userId, userId),
        isNull(items.deletedAt),
        ne(items.id, itemId),
        sql`EXISTS (
          SELECT 1 FROM item_tags it1
          JOIN item_tags it2 ON it1.tag_id = it2.tag_id
          WHERE it1.item_id = ${itemId}
          AND it2.item_id = ${items.id}
        )`
      )
    )
    .orderBy(desc(items.createdAt))
    .limit(limit);
}

export async function getTrashedItems(userId: string): Promise<ItemWithType[]> {
  return db
    .select({ item: items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), isNotNull(items.deletedAt)))
    .orderBy(desc(items.deletedAt));
}

