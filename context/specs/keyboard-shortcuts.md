# Spec for Keyboard Shortcuts

Title: Keyboard Shortcuts
Branch: claude/feature/keyboard-shortcuts
Spec file: context/specs/keyboard-shortcuts.md

## Summary

Add keyboard shortcuts to speed up common actions across the app. Two categories: global navigation shortcuts (fire from anywhere in the app) and item row shortcuts (fire when a row is focused).

## Functional Requirements

- **Cmd+N** (Mac) / **Ctrl+N** (Windows/Linux): navigate to `/items/new`
- **Cmd+Shift+C** (Mac) / **Ctrl+Shift+C** (Windows/Linux): navigate to `/collections/new`
- Global shortcuts must not fire when the user is typing inside an input, textarea, select, or contenteditable element
- Item rows must be keyboard-focusable (tab-navigable)
- When an item row is focused, the following single-key shortcuts apply:
  - `f` — toggle favorite
  - `p` — toggle pin
  - `c` — copy item content to clipboard
- Row shortcuts must not fire when focus is inside an input/textarea (same guard as global)
- All shortcut actions should provide the same feedback as their button equivalents (toast for copy, optimistic UI for favorite/pin)

## Possible Edge Cases

- Cmd+N fires while already on `/items/new` — harmless, just re-navigates
- Row shortcut fires on a file or image item where there is no copyable content — `c` should be a no-op or show a "nothing to copy" toast
- User is on a page with no item rows (e.g. dashboard, settings) — row shortcuts are inert since no rows are focused
- Shortcut fires during a pending server action (double-tap `f`) — the action should complete normally; debounce is not required
- Browser may intercept Cmd+N to open a new window — this is unavoidable on some browsers; acceptable limitation

## Acceptance Criteria

- [ ] Pressing Cmd+N from any app page navigates to `/items/new`
- [ ] Pressing Cmd+Shift+C from any app page navigates to `/collections/new`
- [ ] Neither global shortcut fires when an input/textarea/select is focused
- [ ] Item rows are focusable via Tab key
- [ ] Pressing `f` on a focused row toggles the item's favorite state and refreshes the list
- [ ] Pressing `p` on a focused row toggles the item's pin state and refreshes the list
- [ ] Pressing `c` on a focused row copies the item's content and shows a success toast
- [ ] Pressing `c` on a file/image row is a no-op

## Open Questions

- Should there be a visible shortcut hint UI (e.g. a `?` modal listing all shortcuts)? Not in scope for this iteration.
- Should arrow keys navigate between rows? Out of scope — Tab is sufficient.

## Testing Guidelines

No automated test runner is configured. Manual browser testing:
- Tab to an item row and press f, p, c — verify each action fires correctly
- Press Cmd+N and Cmd+Shift+C from the dashboard, a list page, and inside a search input to confirm guard behavior
- Verify row shortcuts are inert when no row is focused

## Personal Opinion

Good addition — power users will notice immediately and it's low-risk. The implementation is straightforward. The one real concern is Cmd+N: browsers (especially Chrome on some OSes) intercept it to open a new window, which makes the shortcut unreliable. `Cmd+K` is already taken by the search palette pattern (mentioned in the roadmap), so there's no obvious conflict-free alternative. Worth noting in the PR that the shortcut may not work in all browser/OS combos, but it's acceptable for a first pass.
