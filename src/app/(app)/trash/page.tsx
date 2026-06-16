import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTrashedItems } from "@/lib/item-queries";
import { getTrashedCollections } from "@/lib/collection-queries";
import { purgeExpiredTrash } from "@/lib/trash-purge";
import { TrashItemRow } from "@/components/trash/TrashItemRow";
import { TrashCollectionRow } from "@/components/trash/TrashCollectionRow";
import { EmptyTrashButton } from "@/components/trash/EmptyTrashButton";

export default async function TrashPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userId = session.user.id;

  await purgeExpiredTrash();

  const [trashedItems, trashedCollections] = await Promise.all([
    getTrashedItems(userId),
    getTrashedCollections(userId),
  ]);

  const isEmpty = trashedItems.length === 0 && trashedCollections.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Items and collections are permanently deleted after 30 days.
          </p>
        </div>
        {!isEmpty && <EmptyTrashButton />}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-sm">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-8">
          {trashedItems.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 px-4">
                Items ({trashedItems.length})
              </h2>
              <ul className="rounded-lg border border-border divide-y divide-border">
                {trashedItems.map((row) => (
                  <TrashItemRow key={row.item.id} row={row} />
                ))}
              </ul>
            </div>
          )}

          {trashedCollections.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 px-4">
                Collections ({trashedCollections.length})
              </h2>
              <ul className="rounded-lg border border-border divide-y divide-border">
                {trashedCollections.map((row) => (
                  <TrashCollectionRow key={row.collection.id} row={row} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
