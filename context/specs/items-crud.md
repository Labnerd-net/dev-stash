# Spec for Items CRUD

Title: Items CRUD
Branch: claude/feature/items-crud
Spec file: context/specs/items-crud.md

## Summary

Implement the core create, read, update, and delete flow for items — the central data type in DevStash. An item belongs to a user, has a type (from the seeded system types), optional tags, optional collections membership, and content that varies by type (text, URL, file reference). This is the foundational MVP feature everything else builds on.

## Functional Requirements

- Users can create an item with: title, type, content, optional description, optional language (for code types), optional URL, optional isFavorite/isPinned flags
- Users can view a list of all their items, filterable by type via the sidebar
- Users can view a single item in a detail/full view
- Users can edit any field on an item they own
- Users can delete an item they own
- Items are scoped to the authenticated user — users cannot see or modify each other's items
- The item list page is the main workspace (already has stub routes per type in the shell)
- Item types available at creation time are the seeded system types (Snippet, Prompt, Note, Command, File, Image, URL)

## Possible Edge Cases

- Creating an item with no title or content — require at minimum a title
- Deleting an item that belongs to a collection — remove the join record, not the collection
- Very long content values in the list view — truncate with ellipsis
- No items exist yet — show an empty state with a prompt to create the first item
- Item type mismatch (e.g., submitting a URL item without a URL field) — validate per type

## Acceptance Criteria

- A user can create an item and it appears in the item list
- A user can open an item and see its full content
- A user can edit an item and changes persist
- A user can delete an item and it is removed from the list
- Items created by one user are not visible to another
- The sidebar item type links filter the list to that type
- Empty state is shown when no items exist for a given type or overall
- The dashboard stats card counts update to reflect actual item counts

## Open Questions

- What is the content editor for this MVP iteration — plain textarea, or start with CodeMirror/TipTap now? (Recommend plain textarea for MVP, swap editors in Phase 2) - testarea
- Is the item list a grid, a list, or user-selectable? (Recommend list view for MVP) - list for now
- Where does item creation live — a `/items/new` page, a modal, or a slide-over panel? (Recommend a dedicated page for simplicity) - dedicated page
- Should tags be part of this feature or a separate follow-on? (Recommend defer tags to their own feature) - defer tags

## Testing Guidelines

Create test file(s) in `./tests` for:
- Creating an item with valid inputs and confirming it appears in the list
- Attempting to create an item without a title (should error)
- Editing an item and confirming updated values persist
- Deleting an item and confirming it no longer appears
- Confirming items are user-scoped (one user cannot access another's items via direct URL or API)

## Personal Opinion

This is the right first feature — nothing else makes sense without it. Keep the editor simple (plain textarea) for now; swapping in CodeMirror later is easy and avoids over-engineering before the data layer is proven. Recommend deferring tags to a separate feature to keep this PR focused. The existing stub routes in the shell mean the routing work is already done; this is mostly data layer + UI forms.
