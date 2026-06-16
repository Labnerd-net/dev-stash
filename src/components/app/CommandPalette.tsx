"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Plus, FolderPlus, Clock, Trash2, Settings } from "lucide-react";
import { usePalette } from "./PaletteContext";
import { paletteSearch } from "@/actions/search";
import { getTypeColor } from "@/lib/utils";
import type { ItemWithType } from "@/lib/item-queries";

const QUICK_NAV = [
  { label: "New Item",       icon: Plus,       href: "/items/new" },
  { label: "New Collection", icon: FolderPlus, href: "/collections/new" },
  { label: "Recently Used",  icon: Clock,      href: "/recently-used" },
  { label: "Trash",          icon: Trash2,     href: "/trash" },
  { label: "Settings",       icon: Settings,   href: "/settings" },
];

export function CommandPalette() {
  const { isOpen, close } = usePalette();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemWithType[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPending, setIsPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on route change
  useEffect(() => { close(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when opened; reset state when closed
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsPending(false);
      return;
    }
    setIsPending(true);
    debounceRef.current = setTimeout(async () => {
      const res = await paletteSearch(query);
      setResults(res);
      setIsPending(false);
      setActiveIndex(-1);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const showQuickNav = query === "";
  const listItems = showQuickNav
    ? QUICK_NAV.map((n) => ({ href: n.href, label: n.label, type: "nav" as const, nav: n }))
    : results.map((r) => ({ href: `/items/${r.item.id}`, label: r.item.title, type: "item" as const, row: r }));

  function navigate(href: string) {
    close();
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, listItems.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = listItems[activeIndex] ?? listItems[0];
      if (item) navigate(item.href);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search items or jump to…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isPending && (
            <span className="text-xs text-muted-foreground">Searching…</span>
          )}
          <kbd className="shrink-0 inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto py-1">
          {showQuickNav && (
            <>
              <p className="px-4 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Quick Actions
              </p>
              {QUICK_NAV.map((nav, i) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.href}
                    onClick={() => navigate(nav.href)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors",
                      i === activeIndex ? "bg-muted" : "hover:bg-muted/50",
                    ].join(" ")}
                  >
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {!showQuickNav && !isPending && results.length === 0 && (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              No items found for &ldquo;{query}&rdquo;
            </p>
          )}

          {!showQuickNav && results.length > 0 && (
            <>
              <p className="px-4 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Items
              </p>
              {results.map((row, i) => (
                <button
                  key={row.item.id}
                  onClick={() => navigate(`/items/${row.item.id}`)}
                  className={[
                    "w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors",
                    i === activeIndex ? "bg-muted" : "hover:bg-muted/50",
                  ].join(" ")}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: getTypeColor(row.itemType.color) }}
                  />
                  <span className="flex-1 truncate">{row.item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{row.itemType.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
