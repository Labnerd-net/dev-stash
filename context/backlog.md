# Project Backlog

> Generated: 2026-06-16
> Focus: Full audit

---

## Security

### High
- **#1 [src/app/(app)/items/[id]/page.tsx:123]**: Note content rendered via `dangerouslySetInnerHTML` trusts database content. The regex-based `sanitizeHtml` in `src/lib/html-utils.ts` documents a known bypass (`alt="a>b"` leaves trailing content). Any write path that skips sanitization leaves XSS open. Fix: re-sanitize at render time using a DOM-based sanitizer (DOMPurify or Sanitizer API), not just at write time.
- **#2 [src/actions/items.ts:391]**: `duplicateItem` copies `fileUrl` from the source item to the duplicate. Both items share the same R2 object key. When either is permanently deleted, `permanentDeleteItem` deletes the R2 object, leaving the other with a broken file reference. Fix: copy the R2 object to a new key during duplication, or omit file data from duplicates.

### Medium
- **#3 [src/actions/items.ts:90]**: `fileKey` is read directly from FormData and bypasses the Zod schema. A user can submit any string starting with `uploads/<their-userId>/` that points to a nonexistent R2 object, creating phantom file references in the DB. Fix: after the prefix check, verify the R2 object exists via `env.dev_stash_files.head(fileKey)` before inserting.
- **#4 [src/actions/trash.ts]**: `purgeExpiredTrash` is exported as a server action but should not be directly callable from client code. Consider converting to a private function called only from the `/trash` server component to reduce attack surface.

### Low
- **#5 [src/middleware.ts:30]**: API routes (`/api/upload`, `/api/files`, `/api/export`) bypass middleware session checks entirely and rely on per-route `auth.api.getSession()` calls. This is an accepted architectural trade-off, but provides no middleware fallback if a session check is accidentally removed. Low risk currently; worth revisiting if the API surface grows.

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
- **#6 [src/app/(app)/items/[id]/page.tsx:50]**: `getItemIdsByType` is called sequentially after the main `Promise.all`, adding a serial DB round-trip to every item detail page load. Long-term: replace with a targeted query that fetches only prev/next IDs around the current item's `createdAt` instead of loading all IDs.
- **#7 [src/app/(app)/page.tsx:23]**: Dashboard runs 4 separate `COUNT` queries (parallel via `Promise.all`, but still 4 round-trips). Fix: collapse to 2 queries using conditional aggregation — `count()` + `sum(case when is_favorite then 1 else 0 end)` in a single pass per table.

### Low
- **#8 [src/components/app/Sidebar.tsx]**: Tags and collections are re-fetched from DB on every page navigation. No caching layer. At scale this is a meaningful source of DB round-trips. Low priority for single-user usage.

---

## Improvements & Refactors

### High
_None identified._

### Medium
- **#9 [src/app/(app)/page.tsx:71]**: Dashboard "Collections" section always renders "No collections yet." — it never fetches real data. Fix: call `getLatestCollections(userId, 5)` on the dashboard page and render `CollectionGrid`, with the empty state shown only when `collections.length === 0`.
- **#10 [src/components/collections/CollectionSearch.tsx]**: Collection search is client-side only; state is lost on page refresh and won't scale with large collection sets. Fix: move to URL-based search (`/collections?q=...`) with server-side filtering in `getCollections()`, matching the search page pattern.
- **#11 [src/components/items/, src/components/collections/]**: Icon-only buttons (favorite, pin, delete, copy) lack `aria-label` attributes. Screen readers announce nothing meaningful. Fix: audit all `<button>` elements with only icon children and add descriptive labels.

### Low
- **#12 [multiple]**: Empty state UI is duplicated across `ItemList.tsx`, `BulkItemList.tsx`, `CollectionGrid.tsx`, and inline in several page components. Fix: extract to a shared `<EmptyState label icon action />` component in `src/components/shared/`.
- **#13 [multiple pages]**: Page title/subtitle pattern is inconsistent — some pages show item counts, others show nothing. Fix: standardize all list pages to show a subtitle with current count.
- **#14 [multiple components]**: `itemType.color ?? "#888"` appears 5+ times across `ItemRow`, `TrashItemRow`, `TrashCollectionRow`, item detail page, etc. Fix: extract `getTypeColor(color: string | null): string` utility into `src/lib/utils.ts`.
- **#15 [src/components/items/ItemForm.tsx]**: `useEffect` for draft restore has `// eslint-disable-next-line react-hooks/exhaustive-deps`. With React Compiler enabled this can conflict with compiler optimizations. Fix: use the `useRef` mount-guard pattern instead.
- **#16 [item delete flow]**: After soft-deleting an item the user is redirected away with no undo affordance. The item is recoverable from `/trash` but there's no immediate prompt. Fix: show a toast with an "Undo" button that calls `restoreItem(id)` within a short window.
- **#17 [src/components/items/ItemRow.tsx, item detail page]**: Language badge is styled differently in `ItemRow` vs item detail page vs `ItemForm`. Fix: extract a `<LanguageBadge language={string} />` component used in all three.

---

## Feature Ideas

### High
- **#18 [src/components/app/Header.tsx]**: Cmd+K command palette is shown as a UI hint in the header but not implemented. Fix: build a modal dialog that opens on Cmd+K with item search, quick navigation links (New Item, New Collection, Recently Used, Trash, Settings), and type filters.

### Medium
- **#19 [src/components/items/BulkItemList.tsx]**: Bulk actions support favorite, pin, delete, add-to-collection, and add-tag — but the tag action (`bulkAddTag`) is imported and available yet there's no UI for it in the action bar. Fix: add a tag input chip in the bulk bar that calls the existing action.
- **#20 [future]**: No import flow for external content. Add an `/import` page supporting: paste multiple items (one per line), upload a JSON export file, or fetch a GitHub Gist URL and create items from parsed content.
- **#21 [src/app/api/export/]**: Export API only supports exporting all items or a single collection. Add `?type=` and `?tag=` query parameters to `/api/export/items` to enable filtered exports.

### Low
- **#22 [src/app/(app)/collections/[id]/]**: No way to duplicate an entire collection. Fix: add a "Duplicate" action on the collection detail page that clones metadata and item memberships.
- **#23 [future]**: No shareable item links. Items are fully private behind auth. Add an optional public/share toggle per item that generates a token-based read-only URL (e.g. `/share/abc123`).
- **#24 [src/app/(app)/items/[id]/page.tsx]**: No related items section on detail page. Fix: add a "Related" section querying items that share tags with the current item, limited to 5, excluding the current item.
- **#25 [future]**: Language field not included in full-text search index. Searching "python" won't match items where `language = "python"`. Fix: add `COALESCE(language, '')` to the `to_tsvector` expression in `searchItems` and regenerate the GIN index.
- **#26 [future]**: No way to filter collections to favorites-only without browsing the full list. Fix: add a `/collections?filter=favorite` route with a filter chip UI matching the search page type-filter pattern.
- **#27 [future]**: No Cloudflare KV caching for frequently-read, rarely-changed data (tag lists, collection lists, dashboard stats). On hold — current single-user traffic doesn't justify the complexity.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 2 | 2 | 1 | 5 |
| Bugs | 0 | 0 | 0 | 0 |
| Performance | 0 | 2 | 1 | 3 |
| Improvements & Refactors | 0 | 3 | 6 | 9 |
| Feature Ideas | 1 | 3 | 6 | 10 |
| **Total** | **3** | **10** | **14** | **27** |
