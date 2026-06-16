"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { searchItems } from "@/lib/item-queries";
import type { ItemWithType } from "@/lib/item-queries";

export async function paletteSearch(query: string): Promise<ItemWithType[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  return searchItems(session.user.id, query);
}
