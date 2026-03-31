"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  Sparkles,
  FileText,
  Terminal,
  File,
  Image,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Snippets", href: "/snippets", icon: Code2 },
  { label: "Prompts", href: "/prompts", icon: Sparkles },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Commands", href: "/commands", icon: Terminal },
  { label: "Files", href: "/files", icon: File },
  { label: "Images", href: "/images", icon: Image },
  { label: "Links", href: "/links", icon: LinkIcon },
];

export function Sidebar() {
  const pathname = usePathname();

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
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

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
        </div>
      </nav>
    </aside>
  );
}
