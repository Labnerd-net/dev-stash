"use client";

import { useRouter } from "next/navigation";
import { Menu, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./SidebarContext";
import { usePalette } from "./PaletteContext";

interface User {
  name: string;
  email: string;
}

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { openMobile } = useSidebar();
  const { open: openPalette } = usePalette();
  const { resolvedTheme, setTheme } = useTheme();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex items-center h-14 px-4 gap-4 border-b border-border shrink-0">
      <button
        onClick={openMobile}
        className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1 hidden md:flex justify-center">
        <button
          onClick={openPalette}
          className="relative w-full max-w-sm h-8 flex items-center text-left rounded-md bg-input/50 border border-border hover:bg-input/80 transition-colors"
          aria-label="Open command palette"
        >
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
          <span className="pl-8 pr-12 text-sm text-muted-foreground">Search items…</span>
          <kbd className="absolute right-2 inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/collections/new")}>
          New Collection
        </Button>
        <Button size="sm" onClick={() => router.push("/items/new")}>New Item</Button>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <span className="text-sm text-muted-foreground">
            {user.name || user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
