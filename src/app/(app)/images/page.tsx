import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getItemsByType } from "@/lib/item-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { ITEM_TYPE_MAP } from "@/lib/item-type-map";
import { ItemList } from "@/components/items/ItemList";
import { buttonVariants } from "@/lib/button-variants";

export default async function ImagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { typeId, label, singularLabel } = ITEM_TYPE_MAP.images;
  const itemList = await getItemsByType(session.user.id, typeId);
  const tagsMap = await getTagsForItems(itemList.map((r) => r.item.id), session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {itemList.length} {itemList.length === 1 ? singularLabel.toLowerCase() : label.toLowerCase()}
          </p>
        </div>
        <Link href="/items/new" className={buttonVariants({ size: "sm" })}>
          New {singularLabel}
        </Link>
      </div>
      <ItemList items={itemList} label={label} tagsMap={tagsMap} />
    </div>
  );
}
