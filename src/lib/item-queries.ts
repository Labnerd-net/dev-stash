import { db } from "@/db";
import { items, itemTypes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
