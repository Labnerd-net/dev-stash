import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, FolderOpen, Star, Bookmark } from "lucide-react";
import { count, eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, collections } from "@/db/schema";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userId = session.user.id;

  const [
    [{ total: itemCount }],
    [{ total: collectionCount }],
    [{ total: favItemCount }],
    [{ total: favCollectionCount }],
  ] = await Promise.all([
    db.select({ total: count() }).from(items).where(eq(items.userId, userId)),
    db.select({ total: count() }).from(collections).where(eq(collections.userId, userId)),
    db.select({ total: count() }).from(items).where(and(eq(items.userId, userId), eq(items.isFavorite, true))),
    db.select({ total: count() }).from(collections).where(and(eq(collections.userId, userId), eq(collections.isFavorite, true))),
  ]);

  const stats = [
    { label: "Your Items",           value: itemCount,          icon: Package,    color: "text-blue-400",   bg: "bg-blue-500/10"   },
    { label: "Collections",          value: collectionCount,    icon: FolderOpen, color: "text-teal-400",   bg: "bg-teal-500/10"   },
    { label: "Favorite Items",       value: favItemCount,       icon: Star,       color: "text-amber-400",  bg: "bg-amber-500/10"  },
    { label: "Favorite Collections", value: favCollectionCount, icon: Bookmark,   color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your developer knowledge hub
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4 flex items-center gap-4"
          >
            <div className={`${bg} ${color} rounded-md p-2`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      </div>
    </div>
  );
}
