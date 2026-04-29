# Spec for Shiki Syntax Highlighting

Title: Shiki Syntax Highlighting
Branch: claude/feature/shiki-syntax-highlighting
Spec file: context/specs/shiki-syntax-highlighting.md

## Summary

Replace the plain `<pre>` block on the item detail page with Shiki-highlighted HTML for code-type items (snippet, command, prompt). Shiki runs server-side and outputs static HTML — no client JS needed. Notes are excluded (they use TipTap HTML rendered with prose typography, already implemented in item 15).

## Functional Requirements

- Use Shiki to render syntax-highlighted HTML for item types: snippet, command, prompt
- Use a VS Code-compatible dark theme (e.g. `github-dark` or `one-dark-pro`)
- Language is taken from `item.language`; fall back to plaintext when the field is empty or the language is not recognized by Shiki
- Highlighted output replaces the existing `<pre>` block on the item detail page (`/items/[id]`)
- Shiki runs at render time on the server — output is static HTML, no client bundle impact
- Line numbers are displayed always-on for code-type items using CSS counters on Shiki's `.line` spans — no extra packages or client JS required
- Item list rows (`ItemRow`) continue to show plain text previews — Shiki is detail-page only

## Possible Edge Cases

- `item.language` may contain a value Shiki doesn't recognize; must not throw — fall back to plaintext
- Empty `item.content` is already guarded by `fieldConfig.hasContent && item.content` on the detail page — no change needed
- The language strings stored in the DB (`bash`, `c`, `cpp`, `dockerfile`, etc.) may differ from Shiki's bundled language IDs; a mapping or try/catch fallback is needed
- Shiki initializer is async and can be expensive to call per-request; should use a cached/shared highlighter instance

## Acceptance Criteria

- [ ] Snippet, command, and prompt detail pages show syntax-highlighted code instead of plain `<pre>`
- [ ] A VS Code-compatible dark theme is applied
- [ ] Items with no language or an unrecognized language render as plaintext without errors
- [ ] Note, file, image, and URL types are unaffected
- [ ] Line numbers are displayed for all code-type items via CSS counters (always-on, no toggle)
- [ ] No client-side JavaScript is added for highlighting
- [ ] `npm run build` passes with no TypeScript errors

## Open Questions

- Which specific Shiki theme should be used? `github-dark` is widely recognized; `one-dark-pro` would match the CodeMirror editor theme (oneDark). Preference? - one-dark-pro is good
- Should the highlighted block include line numbers? Yes — always-on for code-type items via CSS counters on Shiki's `.line` spans. No user toggle needed at this stage.

## Testing Guidelines

No test runner is configured. Manual browser verification:
- Open a snippet item with a known language (e.g. JavaScript) — confirm colored syntax highlighting
- Open a snippet with no language set — confirm plain text renders without error
- Open a snippet with an obscure/unrecognized language — confirm graceful fallback
- Open a note item — confirm prose HTML rendering is unchanged
- Open a command item — confirm highlighting renders

## Personal Opinion

Good fit for server components — Shiki's async API is well-suited to Next.js server rendering and produces zero client JS. The main risk is the shared highlighter instance pattern; if done incorrectly it can cause cold-start latency on the first render per deployment. Using a module-level cached promise (`let highlighterPromise`) is the standard solution and keeps it simple.

One cosmetic consideration: the Shiki output wraps in a `<pre><code>` with inline styles for background color. The background color from the chosen theme may not exactly match the existing `bg-muted` used elsewhere — minor but worth noting so the detail page doesn't look inconsistent.
