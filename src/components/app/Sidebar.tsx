import Link from "next/link";
import { SidebarNav } from "./SidebarNav";
import { SidebarWrapper } from "./SidebarWrapper";
import { SidebarCloseButton } from "./SidebarCloseButton";
import { getLatestCollections } from "@/lib/collection-queries";

interface SidebarProps {
  userId: string;
}

export async function Sidebar({ userId }: SidebarProps) {
  const latestCollections = await getLatestCollections(userId);

  return (
    <SidebarWrapper>
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border shrink-0">
        <Link
          href="/"
          className="text-sidebar-foreground font-semibold text-base tracking-tight"
        >
          <span className="group-data-[collapsed=true]/sidebar:hidden">DevStash</span>
          <span className="hidden group-data-[collapsed=true]/sidebar:inline">D</span>
        </Link>
        <SidebarCloseButton />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 overflow-x-hidden">
        <p className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider group-data-[collapsed=true]/sidebar:hidden">
          Navigation
        </p>
        <SidebarNav />

        <div className="mt-5 group-data-[collapsed=true]/sidebar:hidden">
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
    </SidebarWrapper>
  );
}
