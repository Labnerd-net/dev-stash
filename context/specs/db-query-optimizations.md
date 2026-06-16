# Spec for DB Query Optimizations

Title: DB Query Optimizations
Branch: claude/fix/db-query-optimizations
Spec file: context/specs/db-query-optimizations.md

## Summary

Two DB query inefficiencies exist on the two most-visited pages. The item detail page issues a serial round-trip to fetch all sibling IDs for prev/next navigation. The dashboard runs four separate COUNT queries when two would do. Both are pure query-layer changes with no UI impact.

## Functional Requirements

### Fix 1 — Item detail prev/next navigation (backlog #2)
- Replace `getItemIdsByType` (which fetches all item IDs for a type) with a targeted query that returns only the immediately adjacent item IDs relative to the current item's position.
- The query must respect the same sort order used on list pages: pinned items first (`isPinned DESC`), then `createdAt DESC`.
- The result must still provide a `prevId` and `nextId` (either may be null when at the boundary).
- Soft-deleted items must be excluded.

### Fix 2 — Dashboard stat queries (backlog #3)
- Replace the four individual COUNT queries with two queries using conditional aggregation: one for items (total count + favorite count), one for collections (total count + favorite count).
- Output values must be identical to the current four separate queries.
- Soft-deleted items/collections must be excluded (same `isNull(deletedAt)` guard).

## Possible Edge Cases

- Item at the first position in its type list: `prevId` must be null.
- Item at the last position: `nextId` must be null.
- Only one item of a type: both `prevId` and `nextId` are null.
- Item is pinned: sort order must still be consistent with the list page so prev/next matches what the user sees.
- Dashboard with zero items or zero collections: counts must return 0, not null.

## Acceptance Criteria

- Item detail page: navigating prev/next stays in the correct order matching the type list page.
- Dashboard stat counts are unchanged before and after the refactor.
- `npm run build` passes with no type errors.
- No new DB queries are introduced; query count is reduced.

## Open Questions

- None.

## Testing Guidelines

No test runner is configured. Verify manually:
- Create several items of the same type (mix pinned and unpinned), open one in the middle, confirm prev/next links match what the list page shows.
- Check dashboard stat counts match the actual item/collection totals.

## Personal Opinion

Both are straightforward, well-scoped improvements. Fix 2 (dashboard) is a trivial two-line change with a clear win. Fix 1 (prev/next) requires a more targeted query but is still contained to one file and one function. No concerns — good changes to make.
