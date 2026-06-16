import { headers } from "next/headers";
import { eq, and, isNotNull, lt } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, collections } from "@/db/schema";

export async function purgeExpiredTrash(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const expiredItems = await db
    .select({ id: items.id, fileUrl: items.fileUrl })
    .from(items)
    .where(and(eq(items.userId, userId), isNotNull(items.deletedAt), lt(items.deletedAt, thirtyDaysAgo)));

  if (expiredItems.length > 0) {
    const fileKeys = expiredItems.map((r) => r.fileUrl).filter(Boolean) as string[];
    if (fileKeys.length > 0) {
      try {
        const { env } = getCloudflareContext();
        await Promise.all(fileKeys.map((key) => env.dev_stash_files.delete(key)));
      } catch {
        // R2 failure is non-fatal
      }
    }
    await db.delete(items).where(and(eq(items.userId, userId), isNotNull(items.deletedAt), lt(items.deletedAt, thirtyDaysAgo)));
  }

  await db
    .delete(collections)
    .where(and(eq(collections.userId, userId), isNotNull(collections.deletedAt), lt(collections.deletedAt, thirtyDaysAgo)));
}
