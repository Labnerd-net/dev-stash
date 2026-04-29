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
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Snippets", href: "/snippets", icon: Code2 },
  { label: "Prompts", href: "/prompts", icon: Sparkles },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Commands", href: "/commands", icon: Terminal },
  { label: "Files", href: "/files", icon: File },
  { label: "Images", href: "/images", icon: Image },
  { label: "Links", href: "/links", icon: LinkIcon },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              title={label}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                "group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="group-data-[collapsed=true]/sidebar:hidden">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
