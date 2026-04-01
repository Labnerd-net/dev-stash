"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import {
  createItemSchema,
  updateItemSchema,
  deleteItemSchema,
} from "@/lib/item-schemas";
import { TYPE_ID_TO_SLUG } from "@/lib/item-type-map";

type ActionResult = { success: boolean; data?: { id: string }; error?: string };

function revalidateItemPaths(typeId: string) {
  revalidatePath("/");
  const slug = TYPE_ID_TO_SLUG[typeId];
  if (slug) revalidatePath(`/${slug}`);
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = createItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { title, typeId, content, url, description, language } = parsed.data;
  const id = crypto.randomUUID();

  await db.insert(items).values({
    id,
    title,
    typeId,
    content: content ?? null,
    url: url || null,
    description: description ?? null,
    language: language ?? null,
    contentType: "text",
    userId: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidateItemPaths(typeId);
  return { success: true, data: { id } };
}

export async function updateItem(formData: FormData): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = updateItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, title, typeId, content, url, description, language } = parsed.data;

  const updated = await db
    .update(items)
    .set({
      title,
      typeId,
      content: content ?? null,
      url: url || null,
      description: description ?? null,
      language: language ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)))
    .returning({ id: items.id });

  if (updated.length === 0) return { success: false, error: "Not found" };

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
    .delete(items)
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)));

  revalidatePath("/");
  return { success: true };
}
