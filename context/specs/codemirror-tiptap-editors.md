# Spec for CodeMirror 6 + TipTap Editors

Title: CodeMirror 6 + TipTap Editors
Branch: claude/feature/codemirror-tiptap-editors
Spec file: context/specs/codemirror-tiptap-editors.md

## Summary

Replace the plain `<textarea>` in `ItemForm` with purpose-built editors for code-type and note-type items. Code-type items (snippet, command, prompt) get CodeMirror 6 with syntax highlighting and language detection. Note-type items get TipTap with basic rich-text/markdown support. All other item types keep the existing textarea.

## Functional Requirements

- Replace the `content` textarea with CodeMirror 6 for item types: snippet, command, prompt
- CodeMirror language mode is selected based on the item's `language` field value; fallback to plaintext when the language is unknown or unset
- Replace the `content` textarea with TipTap for item type: note
- TipTap must support: bold, italic, headings (H1–H3), unordered/ordered lists, inline code, fenced code blocks
- The editor value must be submitted as the `content` field in the existing form, compatible with the current server action (`createItem` / `updateItem`)
- On edit, the editor must be pre-populated with the existing `content` value
- The language selector (already present on snippet/command items) must update the CodeMirror language mode dynamically when changed

## Possible Edge Cases

- Items that have existing plain-text content in a note field must render correctly in TipTap (plain text should be treated as paragraph content)
- Switching item type within the form (if supported) would require swapping editors — confirm whether type is locked after creation
- Very large content values may cause sluggish CodeMirror initialization; no optimization needed unless it becomes a real problem
- Language values in the DB may not exactly match CodeMirror language package names — a mapping layer will be needed
- TipTap outputs HTML; confirm that the `content` column stores HTML without issues and that other display surfaces handle it correctly

## Acceptance Criteria

- [ ] Creating a snippet/command/prompt item shows CodeMirror instead of a textarea
- [ ] Creating a note item shows TipTap instead of a textarea
- [ ] Editing an existing code-type item pre-fills CodeMirror with saved content
- [ ] Editing an existing note item pre-fills TipTap with saved content
- [ ] Changing the `language` field on a code-type item updates the CodeMirror syntax highlighting
- [ ] Submitting the form saves content correctly via the existing server action
- [ ] All other item types (file, image, url) continue using the existing textarea (or no content field if not applicable)
- [ ] No TypeScript errors, build passes

## Open Questions

- Does TipTap store/output HTML or markdown? If HTML, are there any display surfaces (e.g. item detail page) that currently render content as plain text and would need updating to render HTML safely?
- Is item type locked after creation, or can it be changed on the edit page? If changeable, the editor swap must be handled reactively.
- Should CodeMirror be in read-only mode on the item detail (view) page, or is Shiki (item 16) the display solution? Confirm that CodeMirror is edit-only and item 16 handles display. - item 16 handles the display

## Testing Guidelines

No test runner is configured. Manual browser verification:
- Create a snippet item and confirm CodeMirror renders with syntax highlighting
- Create a note item and confirm TipTap toolbar renders and formatting works
- Edit both and confirm content round-trips correctly
- Change language on snippet and confirm highlight mode updates

## Personal Opinion

Good idea — the textarea is the weakest part of the current UX for a tool whose core value proposition is storing code and structured notes. CodeMirror and TipTap are already installed, so this is low-risk integration work.

One concern: TipTap outputs HTML, not plain text or markdown. If the item detail page currently renders `content` as plain text (which it likely does), note content will display as raw HTML tags until item 16 (Shiki) or a separate display-layer pass adds proper rendering. This should be called out clearly so the display fix lands in the same feature or immediately after — not left as a silent regression.
