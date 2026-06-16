# Spec for Recently Used — DB-Backed Cross-Device History

Title: Recently Used DB History
Branch: claude/feature/recently-used-db
Spec file: context/specs/recently-used-db.md

## Summary

The current "recently used" feature tracks item views in localStorage only, making it browser- and device-specific. This replaces (or supplements) the localStorage approach with a `userRecentlyViewed` DB table that records `(userId, itemId, viewedAt)`, enabling cross-device history and a dedicated `/recently-used` page showing the user's full view history.

## Functional Requirements

- Add a `user_recently_viewed` table: `userId`, `itemId`, `viewedAt` (timestamp)
- On every item detail page view, upsert the row for that `(userId, itemId)` — update `viewedAt` if it exists, insert if not (so each item appears only once, showing most recent visit)
- The `/recently-used` page displays all items the user has viewed, ordered by `viewedAt` desc
- The dashboard "Recently Used" section continues to work — it can now read from DB instead of localStorage
- Cap the DB history at 50 entries per user (evict oldest when inserting beyond the cap, or query with `LIMIT 50`)
- The existing localStorage-based `RecentlyUsedTracker` and `RecentlyUsedSection` can be migrated to use the DB path; localStorage tracking can be removed or kept as a fallback

## Possible Edge Cases

- User views the same item multiple times — only one row per `(userId, itemId)`, `viewedAt` updates each time
- Item is soft-deleted — it should not appear in recently used history (join must filter `isNull(items.deletedAt)`)
- Item is permanently deleted — cascade delete or FK constraint should remove the `user_recently_viewed` row
- Upsert on every page view adds a DB write to every item detail load — this is a tradeoff (latency vs. cross-device accuracy); keep it lightweight
- Dashboard "Recently Used" section currently fetches on client mount via localStorage; switching to server-side DB read changes the rendering model

## Acceptance Criteria

- Viewing an item on device A and then loading the dashboard on device B shows that item in "Recently Used"
- Viewing the same item multiple times only shows it once in history (most recent visit time)
- `/recently-used` page lists all viewed items ordered by most recent first
- Soft-deleted or permanently deleted items do not appear in the history
- `npm run build` passes with no type errors

## Open Questions

- Should localStorage tracking be removed entirely or kept as an offline fallback? (DB is authoritative; localStorage can be removed)
- Should the `/recently-used` page be paginated or capped at a fixed number (e.g. 50)?
- Should the dashboard section still be client-rendered (to avoid slowing down initial server render) or switch to server-side?

## Testing Guidelines

- View an item, navigate away, return to dashboard — confirm it appears in "Recently Used"
- View the same item twice — confirm it appears once with updated timestamp
- Delete an item (soft delete) — confirm it no longer appears in recently used
- View items on separate sessions — confirm history merges correctly on the history page

## Personal Opinion

This is a solid, well-scoped improvement. The upsert-on-view pattern is standard and the `(userId, itemId)` unique constraint keeps the table lean. The main risk is the extra DB write on every item detail load — for a single-user app this is a non-issue, but worth noting.

The bigger decision is whether to keep the localStorage path at all. Removing it simplifies the code significantly (no `RecentlyUsedTracker`, no client-side fetch action, no hydration guard). I'd remove it entirely and make the dashboard section a server component that reads from DB directly. Cleaner architecture, less client JS.
