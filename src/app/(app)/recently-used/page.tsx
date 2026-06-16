import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRecentlyViewedItems } from "@/lib/recently-used-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ItemRow } from "@/components/items/ItemRow";

export default async function RecentlyUsedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userId = session.user.id;
  const recentItems = await getRecentlyViewedItems(userId, 50);
  const itemIds = recentItems.map((r) => r.item.id);
  const tagsMap = await getTagsForItems(itemIds, userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recently Viewed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {recentItems.length === 0 ? "No items viewed yet." : `${recentItems.length} item${recentItems.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {recentItems.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {recentItems.map((row) => (
            <ItemRow key={row.item.id} row={row} tags={tagsMap[row.item.id]} />
          ))}
        </ul>
      )}
    </div>
  );
}
