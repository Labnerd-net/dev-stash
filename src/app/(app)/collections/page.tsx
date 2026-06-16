import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCollections } from "@/lib/collection-queries";
import { CollectionSearch } from "@/components/collections/CollectionSearch";
import { buttonVariants } from "@/lib/button-variants";

interface CollectionsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { q } = await searchParams;
  const query = q?.trim() || undefined;

  const userCollections = await getCollections(session.user.id, query);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {query
              ? `${userCollections.length} result${userCollections.length !== 1 ? "s" : ""} for "${query}"`
              : `${userCollections.length} ${userCollections.length === 1 ? "collection" : "collections"}`}
          </p>
        </div>
        <Link
          href="/collections/new"
          className={buttonVariants({ size: "sm" })}
        >
          New Collection
        </Link>
      </div>
      <CollectionSearch collections={userCollections} q={query} />
    </div>
  );
}
