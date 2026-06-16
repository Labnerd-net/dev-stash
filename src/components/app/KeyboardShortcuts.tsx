"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  if (IGNORED_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(document.activeElement)) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && !e.shiftKey && e.key === "n") {
        e.preventDefault();
        router.push("/items/new");
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        router.push("/collections/new");
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
