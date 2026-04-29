import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getFavoriteItems } from "@/lib/item-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ItemList } from "@/components/items/ItemList";
import { buttonVariants } from "@/lib/button-variants";

export default async function FavoritesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const itemList = await getFavoriteItems(session.user.id);
  const tagsMap = await getTagsForItems(itemList.map((r) => r.item.id), session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {itemList.length} {itemList.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Link href="/items/new" className={buttonVariants({ size: "sm" })}>
          New Item
        </Link>
      </div>
      <ItemList items={itemList} label="favorites" tagsMap={tagsMap} />
    </div>
  );
}
