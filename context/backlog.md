# Project Backlog

> Generated: 2026-06-04
> Focus: Full audit

---

## Security

### Medium
- **#5 [src/actions/collections.ts]**: `removeItemFromCollection` verifies that the `collectionId` belongs to the current user but does NOT verify that `itemId` belongs to the current user. Inconsistent with the ownership model in `updateCollection`. Fix: add an ownership check on `itemId` before the delete.
- **#6 [src/actions/ai.ts]**: `suggestTagsFromContent` accepts arbitrary caller-supplied strings and sends them to the Anthropic API without an ownership check on any item. Any authenticated user can send arbitrary content under the app's API key. Mitigated by 4000-char truncation; acceptable for single-user but should add rate limiting if multi-user is ever added.

### Low
- **#7 [src/middleware.ts]**: Middleware checks only for cookie presence (not cryptographic validity) to gate app access. Unauthenticated users with any non-empty session cookie can reach the HTML shell; every server action and API route re-validates the full session so no data is exposed. Document as an accepted Edge middleware trade-off.
- **#8 [src/lib/export.ts]**: `stripHtml()` is a regex-based HTML stripper, not a real parser. Malformed HTML like `<img alt="a>b">` would leave `b">` in the Markdown output. Low risk since output goes to a downloaded file, not rendered HTML. Document the limitation.

---

## Performance

### High
- **#13 [src/db/schema.ts]**: Only one index exists on `items` (`items_user_id_idx` on `userId`). Queries like `getItemsByType` filter on `(userId, typeId)` with `ORDER BY isPinned, createdAt` — a full scan of the user's items on every type-list page. Fix: add a composite index `(userId, typeId)` via a new Drizzle migration. Also add indexes on `collections(userId)`, `tags(userId)`, `itemTags(itemId)`, `itemCollections(collectionId)`.
- **#14 [src/app/(app)/{snippets,prompts,...}/page.tsx]**: All 7 type pages and collection item pages fetch unbounded result sets with no pagination. At 1000+ items, these pages will be slow to load and render. Fix: add cursor-based pagination or a "Load more" pattern with a reasonable per-page limit (e.g., 50).

### Medium
- **#15 [src/lib/item-queries.ts — searchItems]**: The tag match in search uses `ILIKE '%...%'` with a full-table subquery across `item_tags`/`tags` and no index on `tags.name`. Fix: add a `btree` index on `tags(name)` and use prefix matching instead of `%...%` for the tag path.
- **#16 [src/app/api/export/items/route.ts]**: `zipSync` from fflate is synchronous and compresses the entire export in one call. A large export (1000+ items) could hit Cloudflare Workers' CPU time or 128 MB memory limits. Fix: use fflate's streaming `Zip` API, or add a soft cap with a warning response.

### Low
- **#17 [src/middleware.ts]**: Middleware runs for all `/api/upload`, `/api/files`, and `/api/export` routes even though those routes already perform their own full session validation. Redundant overhead. Fix: add those paths to the middleware `matcher` exclusion list.

---

## Improvements & Refactors

### High
- **#18 [src/app/(app)/{snippets,prompts,notes,commands,files,images,links}/page.tsx]**: All 7 item type pages are identical (35 lines each, only the type slug differs). Fix: replace with a single dynamic route `src/app/(app)/[itemType]/page.tsx` that validates the slug against `ITEM_TYPE_MAP` and fetches the correct type. Reduces 7 files to 1 and makes adding new types trivial.

### Medium
- **#20 [src/components/items/FavoriteItemButton.tsx, PinItemButton.tsx]**: Both follow the same `useTransition → startTransition → action → router.refresh()` pattern. Fix: extract a reusable `useItemToggle(action)` hook in `src/hooks/useItemToggle.ts`.
- **#21 [src/lib/item-queries.ts, src/lib/tag-queries.ts]**: No `getItemsByTag()` or `getTagsWithItemCounts()` query helpers exist, which would be needed for tag navigation. Fix: add both to the respective query files.
- **#22 [multiple files]**: Magic numbers scattered across the codebase: `MAX_SIZE = 25MB` in `ItemForm.tsx` (duplicates the constant in the upload route), `10` (recently used cap), `50` (search limit). Fix: centralize in `src/lib/constants.ts`.
- **#23 [src/components/items/ItemForm.tsx]**: No client-side Zod validation before form submission. Tag length limit (50 chars) is enforced only in the server action. Fix: validate on the client before submitting to give instant feedback.
- **#24 [src/app/(app)/layout.tsx]**: No React Error Boundary in the app layout. If a DB query or server component throws, the page shows a generic error with no recovery path. Fix: add an Error Boundary with a user-friendly fallback and a "Try again" link.

### Low
- **#25 [src/components/app/Header.tsx]**: No visible dark/light mode toggle despite `next-themes` being installed. Fix: add a theme toggle button to the header actions area.

---

## Feature Ideas

### High
- **#27 [sidebar + new route]**: No way to browse or filter by tag. Tags exist on items but are only visible on item rows and detail pages. Add a "Tags" section to the sidebar (collapsible, showing top tags) and a `/tags/[tagName]` page listing all items with that tag, filterable by type. This requires `getTagsWithItemCounts()` and `getItemsByTag()` query helpers.
- **#28 [src/components/items/ItemList.tsx + src/actions/items.ts]**: No bulk actions. Users with many items must manage them one at a time. Add checkbox selection to item rows with bulk favorite, pin, delete, add-to-collection, and tag operations.
- **#29 [src/actions/items.ts + item detail page]**: No item duplication. A "Duplicate" action that creates a copy with `"Copy of {title}"` and the same content, type, and tags is a high-value, low-effort addition for users who create variants of existing items.

### Medium
- **#30 [global]**: No keyboard shortcuts beyond the search input. Add Cmd+N for quick-create item, Cmd+Shift+C for new collection, and single-key shortcuts on item rows (`f` = favorite, `p` = pin, `c` = copy). The roadmap already lists this.
- **#31 [src/components/items/ItemForm.tsx]**: No autosave drafts. If the browser closes during a long note or prompt, content is lost. Fix: periodically save form state to localStorage and restore it on next visit to `/items/new`.
- **#32 [src/components/dashboard/RecentlyUsedSection.tsx]**: Recently used is localStorage-only (browser-specific). Add a `userRecentlyUsed(userId, itemId, viewedAt)` DB table to track views cross-device and enable a `/recently-used` history page.
- **#33 [src/app/(app)/collections/page.tsx]**: No way to search collections by name. Add a search input on the collections page, or extend the main search to also return collection results.
- **#34 [item detail page]**: No quick "Add to Collection" action from the item detail page without going to Edit. Add a modal or dropdown to assign/remove collections without a full form re-submit.

### Low
- **#35 [src/app/(app)/items/[id]/page.tsx]**: No prev/next navigation between items on the detail page. Users must go back to the list to navigate. Add prev/next arrows based on the current list context.
- **#36 [src/components/collections/CollectionCard.tsx]**: Collection cards show no preview of items inside. Add 2-3 item title chips as a preview to make collections more scannable.
- **#37 [future]**: No soft-delete / trash. Deleted items are permanently gone. Add a `deletedAt` column to items and collections for a 30-day recovery window.
- **#38 [future]**: No Cloudflare KV caching for frequently-read, rarely-changed data (tag lists, collection lists, dashboard stats). At scale, adding a KV cache layer with revalidation on mutation would reduce DB round-trips meaningfully.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 0 | 2 | 2 | 4 |
| Performance | 2 | 2 | 1 | 5 |
| Improvements & Refactors | 1 | 4 | 1 | 6 |
| Feature Ideas | 3 | 4 | 4 | 11 |
| **Total** | **6** | **12** | **8** | **26** |
