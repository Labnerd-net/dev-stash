# Spec for Copy to Clipboard

Title: Copy to Clipboard
Branch: claude/feature/copy-to-clipboard
Spec file: context/specs/copy-to-clipboard.md

## Summary

Add one-click copy-to-clipboard on item cards and detail views, with a toast confirmation on success. Each item type copies the most useful content field.

## Functional Requirements

### Copy Button
- Every item card (ItemRow) gets a copy button that copies the item's primary content to the clipboard
- The item detail page also has a copy button, styled prominently near the content block
- Primary content by type:
  - snippet / command / prompt → `content`
  - note → strip HTML tags, copy as plain text
  - url → `url` field
  - file / image → skip (no meaningful text to copy; button not rendered)

### Toast Notifications
- After a successful copy, show a toast: "Copied to clipboard"
- Toast auto-dismisses after ~2 seconds
- Toasts render in a consistent corner (bottom-right preferred)
- A toast library or lightweight custom component should be added if one does not already exist

### Copy Button Visibility
- On item cards: visible on hover (desktop), always visible on touch devices
- On detail pages: always visible

## Possible Edge Cases

- Note items contain TipTap HTML output — must strip tags before writing to clipboard so pasted content is clean plain text, not raw markup
- File and image items have no text content to copy; the button should be omitted rather than copying a blank string or a server path
- Clipboard API (`navigator.clipboard.writeText`) is async and requires a secure context (HTTPS or localhost) — handle the promise rejection gracefully with a fallback error toast
- If the user's browser denies clipboard permission, show a toast: "Copy failed — clipboard access denied"

## Acceptance Criteria

- [ ] Copy button appears on every ItemRow (except file/image types)
- [ ] Copy button appears on item detail pages (except file/image types)
- [ ] Clicking copy writes the correct content for each item type
- [ ] Note content is plain text (HTML stripped) when copied
- [ ] A "Copied to clipboard" toast appears and auto-dismisses after ~2 seconds
- [ ] A failure toast appears if clipboard write fails

## Open Questions

- None at this time.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Copy button renders on ItemRow for code/text types and is absent for file/image types
- Note content has HTML stripped before clipboard write
- Success toast appears after a successful copy
- Error toast appears when clipboard write is rejected

## Personal Opinion

Straightforward and high-value. Developers copy snippet content constantly; removing that friction is worth it. The only non-obvious part is the HTML-stripping for note items and the clipboard permission fallback — both are small. This is a clean, low-risk feature.
