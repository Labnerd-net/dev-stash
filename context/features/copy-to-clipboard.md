# Plan: Copy to Clipboard

## Context

Developers frequently need to paste snippet/command/prompt content from DevStash into their editor or terminal. There is currently no copy affordance — users must select text manually. This adds a one-click copy button to `ItemRow` cards and item detail pages, with a toast confirmation.

## Steps

### 1. Install sonner

```
npx shadcn@latest add sonner
```

This installs the `sonner` package and writes `src/components/ui/sonner.tsx` (a thin wrapper around `<Toaster />`). Sonner is the toast library shadcn recommends.

### 2. Mount `<Toaster />` in app layout

**File:** `src/app/(app)/layout.tsx`

Import and render `<Toaster />` from `@/components/ui/sonner` at the bottom of the layout, outside of the main content area.

### 3. Create `CopyButton` client component

**File:** `src/components/items/CopyButton.tsx` (new)

- `"use client"`
- Props: `content: string | null | undefined`, `className?: string`
- If `content` is null/empty, render nothing
- Uses `navigator.clipboard.writeText(text)` — strips HTML first if the string looks like HTML (check for `<` prefix or use `DOMParser`)
- On success: `toast.success("Copied to clipboard")`
- On failure: `toast.error("Copy failed")`
- Renders a small icon button using `Copy` from `lucide-react`, styled to match existing icon buttons (`FavoriteItemButton`, `PinItemButton`)

HTML stripping approach inside `CopyButton`:
```ts
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}
```
Call `stripHtml` only when `content` contains `<` to avoid unnecessary parsing for code types.

### 4. Add `CopyButton` to `ItemRow`

**File:** `src/components/items/ItemRow.tsx`

Determine what to copy based on `item.typeId`:
- `system_snippet` / `system_command` / `system_prompt` / `system_note` → `item.content`
- `system_url` → `item.url`
- `system_file` / `system_image` → `null` (CopyButton renders nothing)

Add `CopyButton` to the actions `<div>` alongside FavoriteItemButton/PinItemButton. For hover visibility, add `group` to the `<li>` and `opacity-0 group-hover:opacity-100 focus-within:opacity-100` to `CopyButton`'s wrapper. This keeps touch devices visible via `focus-within`.

### 5. Add `CopyButton` to item detail page

**File:** `src/app/(app)/items/[id]/page.tsx`

This is a server component — pass the raw string directly as the `content` prop. Determine content by type, same logic as step 4 (already has `CODE_TYPE_IDS` set and `fieldConfig`).

Place `CopyButton` in the header actions `<div>` next to Edit/Delete, always visible.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/sonner.tsx` | Created by shadcn CLI |
| `src/app/(app)/layout.tsx` | Add `<Toaster />` |
| `src/components/items/CopyButton.tsx` | New client component |
| `src/components/items/ItemRow.tsx` | Add CopyButton + group hover |
| `src/app/(app)/items/[id]/page.tsx` | Add CopyButton to actions |

## Verification

1. Run `npm run dev`
2. Open any item list (e.g. `/snippets`) — hover a row, confirm copy button appears
3. Click copy → toast "Copied to clipboard" appears and auto-dismisses
4. Paste into editor — confirm correct content
5. Open a note item row, copy → paste confirms plain text, no HTML tags
6. Open a file/image row — confirm no copy button renders
7. Open an item detail page — copy button visible in header; test all types
8. Run `npm run build` — confirm no type errors
