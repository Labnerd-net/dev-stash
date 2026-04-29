"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    closeMobile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        data-collapsed={isCollapsed}
        className={cn(
          "group/sidebar flex flex-col shrink-0 h-full bg-sidebar border-r border-sidebar-border",
          "transition-[width] duration-200 ease-in-out",
          // Desktop width
          isCollapsed ? "w-[52px]" : "w-[220px]",
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-40 md:relative md:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {children}

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "hidden md:flex items-center justify-center h-8 w-full border-t border-sidebar-border",
            "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors shrink-0"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </aside>
    </>
  );
}
