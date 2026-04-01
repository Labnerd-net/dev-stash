"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface User {
  name: string;
  email: string;
}

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex items-center h-14 px-4 gap-4 border-b border-border shrink-0">
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items…"
            readOnly
            className="w-full h-8 pl-8 pr-12 rounded-md bg-input/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none cursor-default"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          New Collection
        </Button>
        <Button size="sm" onClick={() => router.push("/items/new")}>New Item</Button>
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
