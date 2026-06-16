# Spec for Soft Delete and Trash

Title: Soft Delete and Trash
Branch: claude/feature/soft-delete-trash
Spec file: context/specs/soft-delete-trash.md

## Summary

Replace permanent deletion of items and collections with soft-delete: set a `deletedAt` timestamp instead of removing the row. Deleted records are moved to a `/trash` page where they can be restored or permanently deleted. Records in trash for more than 30 days are purged lazily when the trash page is loaded (no cron job needed for a single-user app).

## Functional Requirements

- Add `deletedAt` (nullable timestamp) to the `items` and `collections` tables via a Drizzle migration
- All existing list queries must filter to `WHERE deletedAt IS NULL` so soft-deleted records are invisible everywhere except `/trash`
- "Delete" on an item or collection sets `deletedAt = now()` instead of removing the row; R2 file deletion is deferred to permanent delete
- `/trash` page shows all soft-deleted items and collections, grouped separately, with the date they were deleted and days remaining before permanent purge
- Restore action: sets `deletedAt = NULL`, making the record visible again everywhere
- Permanent delete action: actually removes the DB row; also deletes the R2 object for file/image items
- Lazy purge: when `/trash` is loaded, permanently delete any records where `deletedAt < now() - 30 days` before rendering the page
- "Empty Trash" button permanently deletes all records in trash at once

## Possible Edge Cases

- Soft-deleted item that belongs to a collection: membership rows are preserved so the item re-appears in the collection on restore
- Soft-deleted collection: its items are NOT soft-deleted — only the collection record is; items remain accessible normally
- Permanently deleting a file/image item: must delete R2 object (same as current `deleteItem` behavior)
- Bulk actions (favorite, pin, add to collection) should not be applicable to soft-deleted items — they are invisible in all list views so this is inherently enforced
- Restoring an item whose collection was also deleted: item is restored, but collection membership still exists; the collection just remains deleted unless separately restored
- `getItemById` must also filter `deletedAt IS NULL` so direct URL access to a deleted item returns 404

## Acceptance Criteria

- [ ] Migration adds `deletedAt` to `items` and `collections`; existing rows unaffected (column defaults to NULL)
- [ ] Clicking delete on an item/collection soft-deletes it and removes it from all list/detail views immediately
- [ ] `/trash` page lists soft-deleted items and collections with deletion date and days remaining
- [ ] Restore button on trash page makes the record visible again in its original list view
- [ ] Permanent delete button on trash page removes the row (and R2 object for files/images)
- [ ] "Empty Trash" permanently deletes all trashed records
- [ ] Records older than 30 days are purged automatically when `/trash` is loaded
- [ ] Search, favorites, recently used, and collections do not surface soft-deleted records

## Open Questions

- Should the sidebar show a "Trash" link permanently, or only when trash is non-empty? Non-empty only is cleaner but requires a count query in the sidebar. Permanent link is simpler — recommend permanent link.
- Should soft-deleted items be excluded from export? Yes — only active records should export.

## Testing Guidelines

Manual browser testing (no test runner configured):
- Delete an item → confirm it disappears from its type list, search, favorites, and recently used
- Visit `/trash` → confirm the item appears with correct deletion date
- Restore the item → confirm it reappears in its type list
- Permanently delete an item from trash → confirm it is gone from trash and cannot be accessed by URL
- Delete a file/image item → permanently delete from trash → verify R2 object is also gone (check via `/api/files/[id]` returning 404)
- Wait scenario (or manually set `deletedAt` to 31 days ago in DB) → load `/trash` → confirm expired record is purged

## Personal Opinion

Solid, well-scoped feature. The lazy-purge approach is the right call here — adding a Cloudflare Cron Trigger just for this would be overkill for a single-user app. The main implementation risk is the query surface area: every query helper that reads items or collections needs a `WHERE deletedAt IS NULL` guard added, and missing even one would silently surface deleted records. Worth doing a careful audit during implementation. No concerns about the approach overall.
