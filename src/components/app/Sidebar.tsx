import Link from "next/link";
import { SidebarNav } from "./SidebarNav";
import { getLatestCollections } from "@/lib/collection-queries";

interface SidebarProps {
  userId: string;
}

export async function Sidebar({ userId }: SidebarProps) {
  const latestCollections = await getLatestCollections(userId);

  return (
    <aside className="flex flex-col w-[220px] shrink-0 h-full bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        <Link
          href="/"
          className="text-sidebar-foreground font-semibold text-base tracking-tight"
        >
          DevStash
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Navigation
        </p>
        <SidebarNav />

        <div className="mt-5">
          <p className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Collections
          </p>
          <Link
            href="/collections"
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            View all collections
          </Link>
          {latestCollections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors truncate"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
