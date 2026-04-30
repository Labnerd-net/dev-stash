# Plan: Recently Used Items

## Context

Phase 3 roadmap item 12. Track the last 10 item detail pages a user visits using localStorage, then surface them in a "Recently Used" section on the dashboard. No database writes needed — pure client-side recency with a server fetch to resolve the stored IDs into full item data.

## Files to Create

### `src/lib/recently-used.ts`
Pure client-side localStorage utility (no imports from Next.js/React).
- `RECENTLY_USED_KEY = "recently-used-item-ids"`
- `MAX_RECENT = 10`
- `pushRecentItem(id: string): void` — prepend id, deduplicate, cap at 10, write back
- `getRecentItemIds(): string[]` — read and parse; return `[]` on any error (SSR, parse failure, quota)

### `src/components/items/RecentlyUsedTracker.tsx`
Client component (`"use client"`). Props: `{ itemId: string }`.  
Calls `pushRecentItem(itemId)` in a `useEffect` with no dependencies (runs once on mount).  
Renders nothing (`return null`).

### `src/components/dashboard/RecentlyUsedSection.tsx`
Client component (`"use client"`). No props.  
On mount (`useEffect`): reads IDs via `getRecentItemIds()`, calls server action `fetchRecentItems(ids)`, sets state.  
Renders nothing if IDs list is empty or fetch returns no items.  
When items are available: renders an `<h2>Recently Used</h2>` header and a `<ul>` of `<ItemRow>` entries (passing tags from the returned map).  
Uses `useState` for `items: ItemWithType[]`, `tagsMap: Record<string, string[]>`, and `mounted: boolean` to guard against SSR.

## Files to Modify

### `src/lib/item-queries.ts`
Add `getItemsByIds(userId: string, ids: string[]): Promise<ItemWithType[]>`:
- Return `[]` immediately if `ids` is empty.
- Query `items` joined with `itemTypes` where `items.userId = userId` AND `items.id IN (ids)`.
- Return results in the same order as `ids` (sort client-side after fetch, or use a CASE expression — client-side sort is simpler).

### `src/actions/recently-used.ts` (new file)
Server action `fetchRecentItems(ids: string[])`:
- Gets session via `auth.api.getSession({ headers: await headers() })`.
- Returns `{ items: [], tagsMap: {} }` if no session or ids is empty.
- Calls `getItemsByIds(userId, ids)` and `getTagsForItems(itemIds)`.
- Returns `{ items: ItemWithType[], tagsMap: Record<string, string[]> }`.
- Preserves input order: sort `items` by the position of each id in `ids`.

### `src/app/(app)/items/[id]/page.tsx`
Add `<RecentlyUsedTracker itemId={item.item.id} />` anywhere in the JSX (renders null, position doesn't matter).

### `src/app/(app)/page.tsx`
Add `<RecentlyUsedSection />` below the stats grid. No props needed.

## Key Constraints

- `getRecentItemIds()` must only be called inside `useEffect` or a click handler — never at render time or in a server context.
- `RecentlyUsedSection` should set `mounted` to `true` in `useEffect` and render `null` until mounted, preventing hydration mismatch.
- `fetchRecentItems` must scope the DB query by `userId` to prevent cross-user data leakage.
- Stale IDs (deleted items) are naturally dropped — `getItemsByIds` simply won't return them; no error handling needed.

## Verification

1. Start dev server (`npm run dev`).
2. Visit two or three item detail pages — each visit should record the ID in `localStorage["recently-used-item-ids"]` (verify in DevTools > Application > Local Storage).
3. Navigate to dashboard — "Recently Used" section should appear with those items rendered as `ItemRow` entries.
4. Re-visit an already-seen item — it should move to the front of the list without duplicating.
5. Verify fresh session (no history) shows no "Recently Used" section on the dashboard.
6. Delete an item that is in the recency list — dashboard should still load without errors; that item is silently absent.
7. Run `npm run build` — no type errors.
