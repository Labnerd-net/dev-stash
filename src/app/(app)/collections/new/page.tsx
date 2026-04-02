import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllItemsMinimal } from "@/lib/collection-queries";
import { CollectionForm } from "@/components/collections/CollectionForm";

export default async function NewCollectionPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const allItems = await getAllItemsMinimal(session.user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Collection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Group your items into a collection.
        </p>
      </div>
      <CollectionForm mode="create" allItems={allItems} />
    </div>
  );
}
