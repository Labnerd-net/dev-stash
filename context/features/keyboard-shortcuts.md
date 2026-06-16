# Plan: Keyboard Shortcuts

## Context
Backlog item #30. Adds Cmd+N / Cmd+Shift+C for global navigation and f/p/c single-key shortcuts on focused item rows. No new dependencies needed — all actions, router hooks, and toast utilities already exist.

---

## Files to create

### `src/components/app/KeyboardShortcuts.tsx` (new)
- `'use client'` component, renders `null`
- `useEffect` mounts a `keydown` listener on `document`; cleanup on unmount
- Guard: skip if `document.activeElement` is `INPUT`, `TEXTAREA`, `SELECT`, or has `contenteditable`
- `Cmd+N` (Mac) / `Ctrl+N` (Win/Linux): `router.push('/items/new')`
- `Cmd+Shift+C` / `Ctrl+Shift+C`: `router.push('/collections/new')`
- Call `e.preventDefault()` before navigating to suppress any browser default

---

## Files to modify

### `src/app/(app)/layout.tsx`
- Import `KeyboardShortcuts` and render it inside `SidebarProvider`, alongside `Toaster`

### `src/components/items/ItemRow.tsx`
- Add `tabIndex={0}` to the `<li>` element
- Add `focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-sm` to the `<li>` className for a visible focus ring
- Add `onKeyDown={handleKeyDown}` to the `<li>`
- Add `handleKeyDown(e: React.KeyboardEvent<HTMLLIElement>)` inside the component:
  - Early return if `e.target !== e.currentTarget` (prevents firing when a child button has focus)
  - Early return if any modifier key is held (`e.metaKey || e.ctrlKey || e.altKey`) to avoid conflicts
  - `'f'` → call `toggleItemFavorite(item.id)` then `router.refresh()`; use `useTransition` to avoid blocking
  - `'p'` → call `toggleItemPin(item.id)` then `router.refresh()`; same transition
  - `'c'` → if `copyContent` is non-null, strip HTML (reuse `stripHtml` already imported) if content contains `<`, then `navigator.clipboard.writeText(...)` with `toast.success` / `toast.error` — same logic as `CopyButton`, no-op if `copyContent` is null
- Import `toggleItemFavorite`, `toggleItemPin` from `@/actions/favorites`
- Import `useTransition` from `react`
- Import `toast` from `sonner`

---

## Reused utilities
- `stripHtml` — already imported in `ItemRow` from `@/lib/html-utils`
- `toggleItemFavorite`, `toggleItemPin` — `@/actions/favorites`
- `toast` — `sonner`
- `useRouter` — already imported in `ItemRow`

---

## Verification
1. `npm run build` — must pass with no type errors
2. Browser: press Cmd+N from dashboard → lands on `/items/new`; press Cmd+Shift+C → lands on `/collections/new`
3. Browser: focus inside the header search input, press Cmd+N → should NOT navigate (guard check)
4. Browser: tab to an item row, press `f` → favorite toggles, list refreshes; press `p` → pin toggles; press `c` → clipboard filled, toast shown
5. Browser: tab focus moves to a child button inside the row, press `f` → shortcut does NOT fire (e.target guard)
6. Browser: tab to a file/image row, press `c` → no-op (copyContent is null)
