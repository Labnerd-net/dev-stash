# Spec for Collections CRUD

Title: Collections CRUD
Branch: claude/feature/collections-crud
Spec file: context/specs/collections-crud.md

## Summary

Add full CRUD functionality for Collections. Collections are named groupings that can hold items of any type. This includes creating, editing, and deleting collections, as well as adding and removing items from them. The sidebar should show the latest collections, and the main collections view should display a grid of collection cards color-coded by dominant item type.

## Functional Requirements

- Collections grid on the `/collections` page showing all user collections as cards
  - Each card shows: name, description, item count, and a color indicator derived from the dominant item type in that collection
  - Empty state when no collections exist
- Create a collection (name required, description optional)
- Edit a collection (name, description)
- Delete a collection with a confirmation step; does not delete the items inside
- Add an item to one or more collections (from the item detail/edit page)
- Remove an item from a collection
- View all collections an item belongs to (visible on item detail page)
- Sidebar shows the latest collections list (most recently updated, capped at a reasonable number, e.g. 10)
- A "New Collection" button in the header or on the collections page triggers collection creation
- Collection pages at `/collections` (list) and `/collections/[id]` (detail — shows all items in the collection)

## Possible Edge Cases

- Deleting a collection that contains items: the items must not be deleted, only the membership associations
- Adding an item to a collection it already belongs to should be a no-op (or show a friendly message)
- Dominant item type color: if a collection is empty, fall back to a neutral/default color
- Collection name uniqueness: the schema does not enforce uniqueness per user; consider whether duplicate names are allowed
- Sidebar collections list should not break layout if collection names are very long

## Acceptance Criteria

- [ ] `/collections` page renders a grid of collection cards with name, description, item count, and a color indicator
- [ ] User can create a collection via a form (name required, description optional)
- [ ] User can edit a collection's name and description
- [ ] User can delete a collection; items in it are unaffected
- [ ] User can add an item to a collection from the item detail or edit page
- [ ] User can remove an item from a collection
- [ ] Item detail page shows which collections the item belongs to
- [ ] Sidebar displays the latest collections list
- [ ] `/collections/[id]` shows all items belonging to that collection
- [ ] Empty states present on collections grid and collection detail page
- [ ] `npm run build` passes with no errors

## Open Questions

- Should collection creation/editing use a dedicated page (matching item pattern) or a modal/drawer? - dedicated page is fine
- Is there a desired cap on the number of collections shown in the sidebar? - maybe 10
- Should items be addable to a collection during item creation (on `/items/new`) or only from an existing item's detail/edit page? - addable during creation
- Dominant item type: is this the most common type by count, or the type of the most recently added item? - most common type

## Testing Guidelines

No automated test runner is configured. Testing is manual via the browser:
- Create a collection and verify it appears in the grid and sidebar
- Edit and delete a collection; confirm items are not affected
- Add and remove items from a collection; verify the item detail page reflects membership correctly
- Check empty states on both the collections grid and a collection detail with no items

## Personal Opinion

This is a straightforward, well-scoped feature and a logical next step. The data model is already in place (Collection, ItemCollection tables), so most of the work is UI and server actions. The trickiest part will be the "add item to collection" UX — deciding where this lives (item create vs. item edit vs. a separate action from the collection detail page) will have a real impact on usability. I'd recommend starting simple: add/remove from the item edit page only, and iterate from there. The dominant-type color logic for cards is a minor complexity but should be a straightforward aggregation query.
