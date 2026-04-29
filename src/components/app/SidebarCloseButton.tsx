"use client";

import { X } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export function SidebarCloseButton() {
  const { closeMobile } = useSidebar();

  return (
    <button
      onClick={closeMobile}
      className="md:hidden p-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      aria-label="Close sidebar"
    >
      <X className="size-4" />
    </button>
  );
}
