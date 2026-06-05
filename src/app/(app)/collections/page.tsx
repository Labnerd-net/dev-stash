import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCollections } from "@/lib/collection-queries";
import { CollectionSearch } from "@/components/collections/CollectionSearch";
import { buttonVariants } from "@/lib/button-variants";

export default async function CollectionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userCollections = await getCollections(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <Link
          href="/collections/new"
          className={buttonVariants({ size: "sm" })}
        >
          New Collection
        </Link>
      </div>
      <CollectionSearch collections={userCollections} />
    </div>
  );
}
