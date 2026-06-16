# Project Backlog

> Generated: 2026-06-16
> Focus: Full audit

---

## Security

### High
- **#1 [src/actions/trash.ts:111]**: `purgeExpiredTrash` accepts a raw `userId` parameter with no session check and performs irreversible `DELETE` operations. As an exported `"use server"` function, any authenticated client can invoke it with an arbitrary userId, permanently deleting another user's trash. Fix: remove the parameter; read session inside the function like every other action in the file.
- **#2 [src/app/(app)/items/[id]/page.tsx:123]**: Note content rendered via `dangerouslySetInnerHTML` trusts database content. The regex-based `sanitizeHtml` in `src/lib/html-utils.ts` documents a known bypass (`alt="a>b"` leaves trailing content). Any write path that skips sanitization leaves XSS open. Fix: re-sanitize at render time using a DOM-based sanitizer (DOMPurify or Sanitizer API), not just at write time.
- **#3 [src/actions/items.ts:391]**: `duplicateItem` copies `fileUrl` from the source item to the duplicate. Both items share the same R2 object key. When either is permanently deleted, `permanentDeleteItem` deletes the R2 object, leaving the other with a broken file reference. Fix: copy the R2 object to a new key during duplication, or omit file data from duplicates.

### Medium
- **#4 [src/actions/trash.ts:111]**: `purgeExpiredTrash` uses `lt(items.deletedAt, thirtyDaysAgo)` without `isNotNull(items.deletedAt)`. Postgres `NULL < date` evaluates to `NULL` (not true), so active items are currently safe — but the intent is not explicit and a schema default change could cause a silent mass-delete. Fix: add `isNotNull(items.deletedAt)` to both `where` clauses.
- **#5 [src/actions/items.ts:90]**: `fileKey` is read directly from FormData and bypasses the Zod schema. A user can submit any string starting with `uploads/<their-userId>/` that points to a nonexistent R2 object, creating phantom file references in the DB. Fix: after the prefix check, verify the R2 object exists via `env.dev_stash_files.head(fileKey)` before inserting.
- **#6 [src/actions/trash.ts:111]**: `purgeExpiredTrash` is exported as a server action but should not be directly callable from client code. Once #1 is fixed (session check inside), also consider whether this should remain an exported server action or be converted to a private function called only from the `/trash` server component. Keeping it exported unnecessarily expands the attack surface.

### Low
- **#7 [src/middleware.ts:30]**: API routes (`/api/upload`, `/api/files`, `/api/export`) bypass middleware session checks entirely and rely on per-route `auth.api.getSession()` calls. This is an accepted architectural trade-off, but provides no middleware fallback if a session check is accidentally removed. Low risk currently; worth revisiting if the API surface grows.

---

## Bugs

### High
_None identified._

### Medium
- **#8 [src/actions/trash.ts:14]**: `restoreItem` performs the `UPDATE` then returns `{ success: true }` regardless of whether any rows were matched. If the item doesn't exist or belongs to another user, the action silently reports success. Fix: use `.returning()` on the update and return `{ success: false, error: "Not found" }` if 0 rows updated — eliminating the second round-trip query at the same time.
- **#9 [src/actions/items.ts:87]**: `rawFileSize` is read from FormData and passed to `parseInt()` with no guard against non-numeric input. `parseInt("abc", 10)` returns `NaN`, which causes an opaque DB error rather than a user-friendly validation message. Fix: validate before use and return a clear error if `isNaN(parsedSize)`.

### Low
- **#10 [src/lib/tag-queries.ts]**: `getTagsWithItemCounts` counts `itemTags` rows without filtering soft-deleted items. Tag counts in the sidebar include items sitting in the trash, showing inflated numbers. Fix: join `items` and add `isNull(items.deletedAt)` to the count expression.

---

## Performance

### High
_None identified._

### Medium
- **#11 [src/app/(app)/items/[id]/page.tsx:50]**: `getItemIdsByType` is called sequentially after the main `Promise.all`, adding a serial DB round-trip to every item detail page load. Fix: include it in the existing `Promise.all`. Long-term: replace with a targeted query that fetches only prev/next IDs around the current item's `createdAt` instead of loading all IDs.
- **#12 [src/app/(app)/page.tsx:23]**: Dashboard runs 4 separate `COUNT` queries (`Promise.all` runs them in parallel, but they're still 4 round-trips). Fix: collapse to 2 queries using conditional aggregation — `count()` + `sum(case when is_favorite then 1 else 0 end)` in a single pass per table.

### Low
- **#13 [src/components/app/Sidebar.tsx]**: Tags and collections are re-fetched from DB on every page navigation. No caching layer. At scale this is a meaningful source of DB round-trips. Held as future work (see #38 in previous backlog). Low priority for single-user usage.

---

## Improvements & Refactors

### High
- **#14 [src/components/items/ItemRow.tsx]**: Tags are rendered as static `<span>` elements. Clicking them does nothing. Navigating to all items with a given tag requires going through the sidebar tag list. Fix: convert to `<Link href={'/tags/${encodeURIComponent(tag)}'}>`  — the `/tags/[tagName]` route already exists.

### Medium
- **#15 [src/app/(app)/page.tsx:71]**: Dashboard "Collections" section always renders "No collections yet." — it never fetches real data. The sidebar already calls `getLatestCollections(userId)`. Fix: call `getLatestCollections(userId, 5)` on the dashboard page and render `CollectionGrid`, with the empty state shown only when `collections.length === 0`.
- **#16 [src/app/(app)/page.tsx:36]**: Dashboard stat cards are not interactive — they show numbers but don't link anywhere. Fix: wrap each in a `<Link>` (Items → `/snippets`, Collections → `/collections`, Favorite Items → `/favorites`).
- **#17 [src/components/collections/CollectionSearch.tsx]**: Collection search is client-side only; state is lost on page refresh and won't scale with large collection sets. Fix: move to URL-based search (`/collections?q=...`) with server-side filtering in `getCollections()`, matching the search page pattern.
- **#18 [src/components/items/ItemForm.tsx]**: When a file upload fails (`uploadError` is set), the submit button remains enabled. A user can submit the form with no file attached when one was expected. Fix: add `uploadError` to the disabled condition: `disabled={isPending || uploadState === "uploading" || !!uploadError}`.
- **#19 [src/components/items/, src/components/collections/]**: Icon-only buttons (favorite, pin, delete, copy) lack `aria-label` attributes. Screen readers announce nothing meaningful. Fix: audit all `<button>` elements with only icon children and add descriptive labels.

### Low
- **#20 [src/app/(app)/items/[id]/page.tsx:26]**: `formatBytes` is defined locally but an identical implementation is already exported from `src/lib/html-utils.ts`. Fix: remove the local copy and import from `@/lib/html-utils`.
- **#21 [src/components/items/ItemForm.tsx:220]**: Type selector is `disabled` on edit mode with no tooltip or help text. Users click it and nothing happens. Fix: add a small note like "Type cannot be changed after creation."
- **#22 [multiple]**: Empty state UI is duplicated across `ItemList.tsx`, `BulkItemList.tsx`, `CollectionGrid.tsx`, and inline in several page components. Fix: extract to a shared `<EmptyState label icon action />` component in `src/components/shared/`.
- **#23 [multiple pages]**: Page title/subtitle pattern is inconsistent — some pages show item counts, others show nothing. `/collections/page.tsx` shows no count; `/favorites/page.tsx` does; `/snippets` etc. do. Fix: standardize all list pages to show a subtitle with current count.
- **#24 [src/app/(app)/collections/[id]/edit/]**: Collection edit page has no back link, unlike item edit which shows "← Back to {type}". Fix: add a cancel/back link in the collection form footer matching the item form pattern.
- **#25 [multiple components]**: `itemType.color ?? "#888"` appears 5+ times across `ItemRow`, `TrashItemRow`, `TrashCollectionRow`, item detail page, etc. Fix: extract `getTypeColor(color: string | null): string` utility into `src/lib/utils.ts`.
- **#26 [src/components/items/ItemForm.tsx]**: `useEffect` for draft restore has `// eslint-disable-next-line react-hooks/exhaustive-deps`. With React Compiler enabled this can conflict with compiler optimizations. Fix: use the `useRef` mount-guard pattern instead.
- **#27 [src/components/items/BulkItemList.tsx]**: Bulk action buttons show static label text during pending state (e.g. "Favorite" stays as "Favorite" while the request is in flight). Fix: change to "Favoriting…", "Pinning…" etc. during `isPending`.
- **#28 [item delete flow]**: After soft-deleting an item the user is redirected away with no undo affordance. The item is recoverable from `/trash` but there's no immediate prompt. Fix: show a toast notification with an "Undo" button that calls `restoreItem(id)` within a short window.
- **#29 [src/components/items/ItemRow.tsx, item detail page]**: Language badge is styled differently in `ItemRow` vs item detail page vs `ItemForm`. Fix: extract a `<LanguageBadge language={string} />` component used in all three.

---

## Feature Ideas

### High
- **#30 [src/components/app/Header.tsx]**: Cmd+K command palette is shown as a UI hint in the header but not implemented (roadmap item 21). Fix: build a modal dialog that opens on Cmd+K with item search, quick navigation links (New Item, New Collection, Recently Used, Trash, Settings), and type filters.

### Medium
- **#31 [src/components/items/BulkItemList.tsx]**: Bulk actions support favorite, pin, delete, add-to-collection, and add-tag — but the tag action (`bulkAddTag`) is imported and available yet there's no UI for it in the action bar. Fix: add a tag input chip in the bulk bar that calls the existing action.
- **#32 [future]**: No import flow for external content. Project overview lists "Import from files" as a planned feature. Add an `/import` page supporting: paste multiple items (one per line), upload a JSON export file, or fetch a GitHub Gist URL and create items from parsed content.
- **#33 [src/app/api/export/]**: Export API only supports exporting all items or a single collection. Add `?type=` and `?tag=` query parameters to `/api/export/items` to enable filtered exports (e.g. all snippets, all items tagged "react").

### Low
- **#34 [src/app/(app)/collections/[id]/]**: No way to duplicate an entire collection. Fix: add a "Duplicate" action on the collection detail page that clones metadata and item memberships.
- **#35 [future]**: No shareable item links. Items are fully private behind auth. Add an optional public/share toggle per item that generates a token-based read-only URL (e.g. `/share/abc123`).
- **#36 [src/app/(app)/items/[id]/page.tsx]**: No related items section on detail page. Fix: add a "Related" section querying items that share tags with the current item, limited to 5, excluding the current item.
- **#37 [future]**: Language field not included in full-text search index. Searching "python" won't match items where `language = "python"`. Fix: add `COALESCE(language, '')` to the `to_tsvector` expression in `searchItems` and regenerate the GIN index.
- **#38 [future]**: No way to filter collections to favorites-only without browsing the full list. Fix: add a `/collections?filter=favorite` route with a filter chip UI matching the search page type-filter pattern.
- **#39 [future]**: No Cloudflare KV caching for frequently-read, rarely-changed data (tag lists, collection lists, dashboard stats). At scale, a KV cache layer with revalidation on mutation would reduce DB round-trips meaningfully. On hold — current single-user traffic doesn't justify the complexity.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 3 | 3 | 1 | 7 |
| Bugs | 0 | 2 | 1 | 3 |
| Performance | 0 | 2 | 1 | 3 |
| Improvements & Refactors | 1 | 5 | 10 | 16 |
| Feature Ideas | 1 | 3 | 6 | 10 |
| **Total** | **5** | **15** | **19** | **39** |
