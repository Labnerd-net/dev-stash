# Plan: Shiki Syntax Highlighting

## Context

The item detail page currently renders all code-type content (snippet, command, prompt) in a plain `<pre>` block with no syntax coloring. Shiki is already installed (`^4.0.2`) but unused. This feature wires it in as a server-side highlighter — zero client JS, static HTML output with inline styles. Theme is `one-dark-pro` (matches the CodeMirror editor). Line numbers via CSS counters on Shiki's `.line` spans.

---

## Shiki API (v4)

```ts
import { createHighlighter } from 'shiki'

const highlighter = await createHighlighter({ themes: [...], langs: [...] })
const html = highlighter.codeToHtml(code, { lang, theme: 'one-dark-pro' })
```

`codeToHtml` is synchronous after the highlighter is initialized. Singleton pattern via module-level cached promise prevents re-initialization across requests.

---

## Step 1 — Create `src/lib/shiki.ts`

New utility module. Three responsibilities:
1. Singleton highlighter cached at module level
2. Language validation against `COMMON_LANGUAGES`
3. `highlightCode` export used by server components

```ts
import { createHighlighter } from 'shiki'
import { COMMON_LANGUAGES } from '@/lib/item-type-map'

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['one-dark-pro'],
      langs: [...COMMON_LANGUAGES],
    })
  }
  return highlighterPromise
}

const SUPPORTED_LANGS = new Set<string>(COMMON_LANGUAGES)

export async function highlightCode(code: string, language?: string | null): Promise<string> {
  const highlighter = await getHighlighter()
  const lang = language && SUPPORTED_LANGS.has(language) ? language : 'text'
  return highlighter.codeToHtml(code, { lang, theme: 'one-dark-pro' })
}
```

## Step 2 — Update `src/app/(app)/items/[id]/page.tsx`

**Current content block (lines 84–96):**
```tsx
{fieldConfig.hasContent && item.content && (
  <div className="space-y-1">
    <p ...>Content</p>
    {item.typeId === "system_note" ? (
      <div dangerouslySetInnerHTML={{ __html: item.content }} />
    ) : (
      <pre className="rounded-lg border border-border bg-muted p-4 ...">
        {item.content}
      </pre>
    )}
  </div>
)}
```

**Change:**
- Add constant at top of file: `const CODE_TYPE_IDS = new Set(["system_snippet", "system_command", "system_prompt"])`
- For code types: call `await highlightCode(item.content, item.language)` and render in a `<div className="line-numbers overflow-hidden rounded-lg border border-border">` via `dangerouslySetInnerHTML`
- Note type: unchanged (`dangerouslySetInnerHTML` with prose styling)
- No other types have `hasContent: true`, so the `<pre>` fallback can be removed

The detail page is already an `async` server component so `await` works directly.

## Step 3 — Update `src/app/globals.css`

Add CSS for line numbers after the existing `@plugin` lines:

```css
/* Shiki line numbers */
.line-numbers .line {
  display: block;
}
.line-numbers .line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2ch;
  min-width: 2ch;
  margin-right: 1.5rem;
  text-align: right;
  color: oklch(50% 0 0);
  user-select: none;
}
.line-numbers {
  counter-reset: line;
  padding: 1rem;
}
```

Note: Shiki outputs its own `<pre>` with inline background styles. The `.line-numbers` wrapper div provides the counter context and padding; no need to override Shiki's background.

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/shiki.ts` | New — singleton highlighter + `highlightCode` export |
| `src/app/(app)/items/[id]/page.tsx` | Replace `<pre>` with Shiki HTML for code types |
| `src/app/globals.css` | Add line number CSS |

---

## Verification

1. Open a snippet item with `javascript` language → colored syntax highlighting with line numbers
2. Open a command item (no language field) → plaintext highlighting with line numbers
3. Open a snippet with no language set → plaintext, no errors
4. Open a note item → prose HTML rendering unchanged
5. Page source contains no `<script>` tags for highlighting (server-rendered inline styles only)
6. `npm run build` passes with no TypeScript errors
