"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getItemsByIds, type ItemWithType } from "@/lib/item-queries";
import { getTagsForItems } from "@/lib/tag-queries";

export async function fetchRecentItems(ids: string[]): Promise<{
  items: ItemWithType[];
  tagsMap: Record<string, string[]>;
}> {
  if (ids.length === 0) return { items: [], tagsMap: {} };

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { items: [], tagsMap: {} };

  const userId = session.user.id;
  const fetchedItems = await getItemsByIds(userId, ids);
  const itemIds = fetchedItems.map((r) => r.item.id);
  const tagsMap = await getTagsForItems(itemIds, userId);

  return { items: fetchedItems, tagsMap };
}
