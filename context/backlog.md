# Project Backlog

> Generated: 2026-06-16
> Focus: Full audit

---

## Security

### High
_None identified._

### Medium
_None identified._

### Low
- **#1 [src/middleware.ts:30]**: API routes (`/api/upload`, `/api/files`, `/api/export`) bypass middleware session checks entirely and rely on per-route `auth.api.getSession()` calls. This is an accepted architectural trade-off, but provides no middleware fallback if a session check is accidentally removed. Low risk currently; worth revisiting if the API surface grows.

---

## Bugs

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Performance

### High
_None identified._

### Medium
- **#2 [src/app/(app)/items/[id]/page.tsx:50]**: `getItemIdsByType` is called sequentially after the main `Promise.all`, adding a serial DB round-trip to every item detail page load. Long-term: replace with a targeted query that fetches only prev/next IDs around the current item's `createdAt` instead of loading all IDs.
- **#3 [src/app/(app)/page.tsx:23]**: Dashboard runs 4 separate `COUNT` queries (parallel via `Promise.all`, but still 4 round-trips). Fix: collapse to 2 queries using conditional aggregation — `count()` + `sum(case when is_favorite then 1 else 0 end)` in a single pass per table.

### Low
- **#4 [src/components/app/Sidebar.tsx]**: Tags and collections are re-fetched from DB on every page navigation. No caching layer. At scale this is a meaningful source of DB round-trips. Low priority for single-user usage.

---

## Improvements & Refactors

### High
_None identified._

### Medium
- **#5 [src/components/collections/CollectionSearch.tsx]**: Collection search is client-side only; state is lost on page refresh and won't scale with large collection sets. Fix: move to URL-based search (`/collections?q=...`) with server-side filtering in `getCollections()`, matching the search page pattern.

### Low
- **#6 [multiple]**: Empty state UI is duplicated across `ItemList.tsx`, `BulkItemList.tsx`, `CollectionGrid.tsx`, and inline in several page components. Fix: extract to a shared `<EmptyState label icon action />` component in `src/components/shared/`.
- **#7 [src/components/items/ItemForm.tsx]**: `useEffect` for draft restore has `// eslint-disable-next-line react-hooks/exhaustive-deps`. With React Compiler enabled this can conflict with compiler optimizations. Fix: use the `useRef` mount-guard pattern instead.
- **#8 [item delete flow]**: After soft-deleting an item the user is redirected away with no undo affordance. The item is recoverable from `/trash` but there's no immediate prompt. Fix: show a toast with an "Undo" button that calls `restoreItem(id)` within a short window.
- **#9 [src/components/items/ItemRow.tsx, item detail page]**: Language badge is styled differently in `ItemRow` vs item detail page vs `ItemForm`. Fix: extract a `<LanguageBadge language={string} />` component used in all three.

---

## Feature Ideas

### High
- **#10 [src/components/app/Header.tsx]**: Cmd+K command palette is shown as a UI hint in the header but not implemented. Fix: build a modal dialog that opens on Cmd+K with item search, quick navigation links (New Item, New Collection, Recently Used, Trash, Settings), and type filters.

### Medium
- **#11 [src/components/items/BulkItemList.tsx]**: Bulk actions support favorite, pin, delete, add-to-collection, and add-tag — but the tag action (`bulkAddTag`) is imported and available yet there's no UI for it in the action bar. Fix: add a tag input chip in the bulk bar that calls the existing action.
- **#12 [future]**: No import flow for external content. Add an `/import` page supporting: paste multiple items (one per line), upload a JSON export file, or fetch a GitHub Gist URL and create items from parsed content.
- **#13 [src/app/api/export/]**: Export API only supports exporting all items or a single collection. Add `?type=` and `?tag=` query parameters to `/api/export/items` to enable filtered exports.

### Low
- **#14 [src/app/(app)/collections/[id]/]**: No way to duplicate an entire collection. Fix: add a "Duplicate" action on the collection detail page that clones metadata and item memberships.
- **#15 [future]**: No shareable item links. Items are fully private behind auth. Add an optional public/share toggle per item that generates a token-based read-only URL (e.g. `/share/abc123`).
- **#16 [src/app/(app)/items/[id]/page.tsx]**: No related items section on detail page. Fix: add a "Related" section querying items that share tags with the current item, limited to 5, excluding the current item.
- **#17 [future]**: Language field not included in full-text search index. Searching "python" won't match items where `language = "python"`. Fix: add `COALESCE(language, '')` to the `to_tsvector` expression in `searchItems` and regenerate the GIN index.
- **#18 [future]**: No way to filter collections to favorites-only without browsing the full list. Fix: add a `/collections?filter=favorite` route with a filter chip UI matching the search page type-filter pattern.
- **#19 [future]**: No Cloudflare KV caching for frequently-read, rarely-changed data (tag lists, collection lists, dashboard stats). On hold — current single-user traffic doesn't justify the complexity.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 0 | 0 | 1 | 1 |
| Bugs | 0 | 0 | 0 | 0 |
| Performance | 0 | 2 | 1 | 3 |
| Improvements & Refactors | 0 | 1 | 4 | 5 |
| Feature Ideas | 1 | 3 | 5 | 9 |
| **Total** | **1** | **6** | **11** | **18** |
