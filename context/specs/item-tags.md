# Spec for Item Tags

Title: Item Tags
Branch: claude/feature/item-tags
Spec file: context/specs/item-tags.md

## Summary

Add the ability to tag items with user-defined labels. Tags are per-user and reusable across items. The `tags` and `item_tags` tables already exist in the schema; this feature wires up the UI and server-side logic to create, assign, remove, and display tags.

Tags should be manageable directly from the item create and edit forms using a tag input that supports typing new tag names (auto-creating them) and selecting existing ones. Tags should be visible on item cards in list views and on the item detail page.

## Functional Requirements

- Users can add one or more tags to an item during create or edit
- A tag is created automatically the first time a user types a new tag name; existing tags are reused by name match (case-insensitive)
- Tags are scoped to the user — no sharing across users
- Tags are displayed as small badges/chips on item rows in list views
- Tags are displayed on the item detail page
- Tags can be removed from an item via the edit form
- Tag names should be trimmed and normalized (lowercase) before save/lookup
- Deleting a tag name from the input removes the item→tag association on save; orphaned tags (no items) are not automatically deleted (leave them for a future cleanup feature)

## Possible Edge Cases

- Duplicate tag names entered in the same form submission (deduplicate before saving)
- Tag name that is only whitespace (reject/ignore)
- Very long tag names (cap at a reasonable length, e.g. 50 characters)
- User edits an item and submits with the tag list unchanged — should not create duplicate `item_tag` rows
- Concurrent saves on the same item (handled by the existing atomic replace pattern used in collections)

## Acceptance Criteria

- [ ] ItemForm shows a tag input on both create and edit screens
- [ ] Existing tags for the current user are suggested as the user types
- [ ] Submitting the form with tags saves the correct `item_tags` rows
- [ ] Submitting the form with no tags clears all existing tags on the item (on edit)
- [ ] Tags render as badges on ItemRow in the list view
- [ ] Tags render on the item detail page
- [ ] Tags are visually distinct and readable in the dark theme

## Open Questions

- Should the tag input be a simple comma-separated text field or a multi-value chip input? A chip/pill UI is cleaner but requires more client-side state. - chip/pill
- Should tags appear in the sidebar (as a navigation filter) in this feature, or defer that to a later phase? - save for later

## Testing Guidelines

Create tests in `./tests/` for:
- Tag normalization (trim, lowercase, dedup)
- Server action: creating an item with new tags creates the correct tag rows
- Server action: editing an item replaces its tags atomically
- Server action: editing an item with no tags clears all tag associations

## Personal Opinion

This is a straightforward and well-scoped feature — the schema is already in place, which removes the riskiest part. The main decision is the tag input UX: a comma-separated text field is the simplest implementation and avoids unnecessary client-side complexity for now; a chip input can come later. The atomic replace pattern already used for collections membership maps cleanly here. No concerns.
