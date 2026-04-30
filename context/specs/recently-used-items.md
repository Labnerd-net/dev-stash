# Spec for Recently Used Items

Title: Recently Used Items
Branch: claude/feature/recently-used-items
Spec file: context/specs/recently-used-items.md

## Summary

Track the last 10 items a user opens and surface them on the dashboard. Recency is stored in `localStorage` on the client so no database writes are needed for this feature. The dashboard home view displays these items in a "Recently Used" section, giving users quick access to their most recently accessed content.

## Functional Requirements

- When a user navigates to an item detail page, record that item's ID in a `localStorage` key (e.g. `recently-used-item-ids`)
- Cap the list at 10 item IDs; when a new ID is added, push it to the front and drop any entry beyond position 10
- If an item ID is already in the list, move it to the front instead of duplicating it
- The dashboard (`/dashboard` or `/`) displays a "Recently Used" section that reads IDs from `localStorage` and fetches the corresponding items from the server
- Display the recently used items as a horizontal or grid list of item cards (reuse existing `ItemRow` or a compact card variant)
- If `localStorage` is empty or unavailable (SSR), hide the section gracefully
- Removing or deleting an item should not cause a visible error if its ID lingers in `localStorage`; stale IDs are silently dropped from the rendered list

## Possible Edge Cases

- SSR: `localStorage` is not available on the server; the recently-used list must be read only on the client after hydration
- Stale IDs: items may be deleted after their ID is stored; the fetch must handle missing items without breaking the UI
- Multiple tabs: each tab writes to the same `localStorage` key; last-write wins is acceptable
- Empty state: if the user has no history yet, the section should not render at all rather than showing an empty placeholder
- Item ownership: server action that fetches items by ID must still scope by `userId` to prevent reading another user's items

## Acceptance Criteria

- Visiting an item detail page records its ID at the front of the `localStorage` list
- Re-visiting an existing ID moves it to the front without creating a duplicate
- The list never exceeds 10 entries
- The dashboard "Recently Used" section renders with real item data when IDs exist in `localStorage`
- Stale IDs (deleted items) are silently omitted from the rendered list
- No "Recently Used" section appears on the dashboard when the list is empty
- No server errors occur from stale or missing IDs

## Open Questions

- Should the recently-used section appear on the dashboard only, or also in the sidebar?
- Should the section use the existing `ItemRow` component or a more compact card variant suited for a horizontal scroll?

## Testing Guidelines

Create tests in `./tests` for:
- The localStorage utility: push to front, deduplicate, cap at 10, handle empty state
- That stale IDs are filtered out after the server fetch returns fewer items than requested

## Personal Opinion

This is a straightforward, low-risk feature that improves daily usability significantly — most users will naturally return to the same handful of items repeatedly. Pure client-side storage keeps it simple and avoids schema changes. The main risk is SSR/hydration mismatch if the section is rendered server-side; a client-only component wrapper handles that cleanly. Overall a good addition.
