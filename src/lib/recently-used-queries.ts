import { db } from "@/db";
import { items, itemTypes, userRecentlyViewed } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import type { ItemWithType } from "@/lib/item-queries";

export async function recordItemView(userId: string, itemId: string): Promise<void> {
  await db
    .insert(userRecentlyViewed)
    .values({ userId, itemId, viewedAt: new Date() })
    .onConflictDoUpdate({
      target: [userRecentlyViewed.userId, userRecentlyViewed.itemId],
      set: { viewedAt: new Date() },
    });
}

export async function getRecentlyViewedItems(
  userId: string,
  limit: number
): Promise<ItemWithType[]> {
  return db
    .select({ item: items, itemType: itemTypes })
    .from(userRecentlyViewed)
    .innerJoin(items, eq(userRecentlyViewed.itemId, items.id))
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(userRecentlyViewed.userId, userId), isNull(items.deletedAt)))
    .orderBy(desc(userRecentlyViewed.viewedAt))
    .limit(limit);
}
