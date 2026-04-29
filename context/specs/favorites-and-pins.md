# Spec for Favorites and Pins

Title: Favorites and Pins
Branch: claude/feature/favorites-and-pins
Spec file: context/specs/favorites-and-pins.md

## Summary

Allow users to mark items as favorites and/or pinned. Pinned items surface at the top of their respective type list views. Favorites are accessible via a dedicated filter or view. Collections can also be favorited. These are independent flags — an item can be pinned, favorited, both, or neither.

## Functional Requirements

- Toggle favorite on any item (stored as `isFavorite` boolean on the item)
- Toggle favorite on any collection (stored as `isFavorite` boolean on the collection)
- Toggle pin on any item (stored as `isPinned` boolean on the item)
- Pinned items appear at the top of their type list page, sorted before non-pinned items
- A "Favorites" view/filter that shows all favorited items across all types
- Favorite and pin toggles are accessible from:
  - The item row in list views
  - The item detail page
- Favorite toggle is accessible from:
  - The collection card in the collections grid
  - The collection detail page
- State changes take effect immediately without full page reload (optimistic UI or revalidation)
- The schema already has `isFavorite` and `isPinned` columns on items and `isFavorite` on collections — no migration needed

## Possible Edge Cases

- Pinned items should still respect the type filter — pinned snippets appear at top of snippets list only, not other type lists
- If a pinned item is also in search results, no special sorting guarantee is needed — search has its own ranking
- Favoriting a collection that has since been deleted should not error
- A user should only be able to toggle their own items/collections, not other users'

## Acceptance Criteria

- [ ] Clicking the favorite icon on an item toggles `isFavorite` and reflects visually (filled vs outline icon)
- [ ] Clicking the pin icon on an item toggles `isPinned` and reflects visually
- [ ] Pinned items sort before non-pinned items on all 7 type list pages
- [ ] A "Favorites" page or filtered view shows all items where `isFavorite = true`
- [ ] Clicking the favorite icon on a collection toggles `isFavorite` on the collection
- [ ] Favorited collections are visually distinguished in the collections grid
- [ ] All toggle actions are ownership-checked server-side
- [ ] No migration is required (columns already exist in schema)

## Open Questions

- Should "Favorites" be a sidebar nav link (showing items only, or items + collections combined)? - items only
- Should favorited collections appear in a separate section, or just be visually flagged in the main collections grid? - visually flagged only
- Should pinned items show a distinct visual indicator in the list row (e.g. a pin icon), or just bubble to the top silently? - pin icon

## Testing Guidelines

No test runner is configured. Manual browser testing:

- Toggle favorite on an item from the list view and verify icon state updates
- Toggle favorite on an item from the detail page and verify icon state updates
- Toggle pin on an item and verify it moves to the top of the list on refresh
- Navigate to the Favorites view and verify only favorited items appear
- Toggle favorite on a collection and verify visual change in the grid
- Attempt to favorite another user's item (if test accounts exist) and verify it fails

## Personal Opinion

This is a straightforward, high-value feature — developers will use favorites constantly to surface their most-used items. The schema already supports it, so the work is primarily UI + server actions.

One concern: the roadmap combines "favorites" (items and collections) with "pins" (items only) into a single feature. That's fine, but the Favorites view needs a design decision: items-only or items + favorited collections? I'd recommend items-only for the Favorites page, with favorited collections flagged visually in the collections grid — this keeps the views coherent with the existing type-scoped architecture. Worth confirming before implementing.
