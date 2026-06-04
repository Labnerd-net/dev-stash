# Spec for export-items-collections

Title: Export Items and Collections
Branch: claude/feature/export-items-collections
Spec file: context/specs/export-items-collections.md

## Summary

Allow users to export their items and collections in JSON or Markdown format and download the result directly from the UI. Covers exporting all items, all items as Markdown, and exporting a single collection's items.

## Functional Requirements

- Export all items as a single JSON file containing full item data (title, type, content, tags, collections, metadata)
- Export all items as Markdown — one combined file with each item as a section, or optionally one file per item in a zip
- Export a single collection as JSON or Markdown (items scoped to that collection)
- Download is triggered from the UI without navigating away from the page
- Exported files should have sensible filenames (e.g. `devstash-export-2026-06-04.json`, `devstash-collection-react-patterns.md`)
- Tags should be included in exports
- File/image items should note the filename and size but not attempt to export binary content
- User must be authenticated; export is scoped to their own data only

## Possible Edge Cases

- User has no items — export should produce a valid but empty structure (not an error)
- Item content is null (file/image types) — export gracefully omits or notes the content
- Very large exports — response may be slow; consider a loading state
- Collection export when collection has no items — handle gracefully
- Markdown content (note type) contains HTML — should be included as-is or stripped to plain text

## Acceptance Criteria

- [ ] "Export" option is accessible from the UI (settings page, header menu, or collection detail page)
- [ ] Exporting all items as JSON downloads a valid `.json` file with all item data
- [ ] Exporting all items as Markdown downloads a `.md` file with each item as a named section
- [ ] Exporting a single collection downloads only items in that collection
- [ ] Tags are present in both JSON and Markdown exports
- [ ] File/image items are represented in exports without binary content
- [ ] Export is scoped to the authenticated user — no cross-user data possible
- [ ] Empty exports produce a valid file, not an error

## Open Questions

- Should Markdown export be one combined file or a zip of individual files? (Combined is simpler; zip is more useful for large exports) - Zip file
- Where should the export UI live? Options: a dedicated `/settings/export` page, a dropdown in the header, or per-collection on the collection detail page - settings page
- Should collection export be JSON only, Markdown only, or both? - maybe an option to do either?

## Testing Guidelines

- Test that JSON export includes all expected fields for each item type
- Test that Markdown export produces correct section headers and content
- Test that collection export is correctly scoped (no items from other collections)
- Test unauthenticated access returns 401
- Test empty item set produces valid output

## Personal Opinion

This is a straightforward, high-value feature. Export is a trust-building capability — users are more likely to store important data in a tool they know they can get their data back out of. JSON + Markdown covers the two most useful cases (programmatic use vs. human-readable backup).

The main complexity decision is the export UI location. I'd recommend: all-items export in a settings or profile page, and per-collection export on the collection detail page. That's the most discoverable layout without cluttering the header.

One concern: Markdown export for note types (which contain TipTap HTML) will need a decision on whether to strip tags or include raw HTML. Including raw HTML in a `.md` file is valid but ugly. Stripping is cleaner but lossy for formatting.
