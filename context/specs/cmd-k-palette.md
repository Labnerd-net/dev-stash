# Spec for Cmd+K Command Palette

Title: Cmd+K Command Palette
Branch: claude/feature/cmd-k-palette
Spec file: context/specs/cmd-k-palette.md

## Summary

The header already shows a "⌘K" hint but pressing Cmd+K does nothing. This spec defines a modal command palette that opens on Cmd+K (or Ctrl+K on Windows/Linux), providing keyboard-driven item search and quick navigation links without leaving the current page.

## Functional Requirements

- Pressing Cmd+K (Mac) or Ctrl+K (Windows/Linux) opens the palette from anywhere in the app, except when focus is inside an input, textarea, select, or contenteditable element.
- Pressing Escape or clicking the backdrop closes the palette.
- The palette opens with a text input focused and ready to type.
- **Search mode**: typing in the input calls the existing `searchItems` server action (or a dedicated fetch) and displays matching items in a scrollable results list. Results show item title, type color dot, and type name.
- Clicking or pressing Enter on a result navigates to `/items/[id]` and closes the palette.
- **Quick nav links** (always visible, above search results or shown when input is empty):
  - New Item → `/items/new`
  - New Collection → `/collections/new`
  - Recently Used → `/recently-used`
  - Trash → `/trash`
  - Settings → `/settings`
- Arrow keys navigate the combined list (quick nav + results). Enter activates the focused item.
- The existing `KeyboardShortcuts` component handles Cmd+N and Cmd+Shift+C — Cmd+K must not conflict with those.
- The header "⌘K" button should also open the palette on click.

## Possible Edge Cases

- Palette opened while already on `/items/new` — quick nav link still navigates (no-op route change is fine).
- Search returns 0 results — show an empty state message.
- Search while typing fast — debounce or use React's `useTransition` to avoid stale results flickering.
- Palette open when user presses Cmd+N — close palette, then navigate (or let existing shortcut handle it; guard by checking palette state).
- Very long item titles — truncate with ellipsis.
- Mobile — Cmd+K shortcut won't fire; the header button should still open it.

## Acceptance Criteria

- Cmd+K opens the palette from any page.
- Escape and backdrop click close it.
- Typing searches items and displays results within ~300ms.
- Arrow keys move focus through the list; Enter navigates.
- Quick nav links are always visible when input is empty.
- Header ⌘K button opens the palette.
- `npm run build` passes with no type errors.

## Open Questions

- Should search results include collections, or only items? (Recommend: items only for now, matching the existing `searchItems` helper.)
- Should the palette remember the last query between opens? (Recommend: no — clear on close.)

## Testing Guidelines

No test runner configured. Verify manually:
- Open palette with Cmd+K, type a partial item title, confirm results appear.
- Click a result and confirm navigation to item detail page.
- Press Escape, confirm palette closes.
- Use arrow keys to navigate results and press Enter.
- Click the header ⌘K button — palette opens.
- Focus a text input, press Cmd+K — palette must NOT open.

## Personal Opinion

This is the right feature to build now. It's high-visibility, frequently used in tools like Linear and Raycast (the stated inspirations), and the infrastructure (search, routing, keyboard shortcuts) is already in place. The main complexity is the modal UX and keyboard navigation — both are well-understood patterns. No concerns.
