# Plan: AI Features with Claude Haiku

## Context

DevStash items currently have no AI assistance. This adds four on-demand AI actions powered by the Anthropic Claude Haiku API: auto-tag suggestions (on the create/edit form), code explanation (snippet/command detail page), AI summary (note/prompt detail page), and prompt optimizer (prompt detail page). All results are ephemeral — nothing is persisted to the database.

`ANTHROPIC_API_KEY` is stored as a Cloudflare Worker secret (not per-user). The API is called via native `fetch` (no SDK needed) from server actions that access the key through `getCloudflareContext().env.ANTHROPIC_API_KEY`.

---

## Step 1 — Infrastructure

**`worker-configuration.d.ts`** — add `ANTHROPIC_API_KEY: string` to `CloudflareEnv`.

**`wrangler.jsonc`** — add `ANTHROPIC_API_KEY` to the secrets comment at the bottom.

Set the secret: `wrangler secret put ANTHROPIC_API_KEY`

---

## Step 2 — Anthropic Utility (`src/lib/anthropic.ts`)

New file. Single exported function:

```
callHaiku(systemPrompt: string, userContent: string): Promise<string>
```

- Gets key via `getCloudflareContext().env.ANTHROPIC_API_KEY`
- Truncates `userContent` to 4000 chars before sending
- POSTs to `https://api.anthropic.com/v1/messages` with model `claude-haiku-4-5-20251001`, `max_tokens: 512`
- Throws a descriptive error if the key is missing or the API returns non-200
- Returns the first content block's text

---

## Step 3 — Server Actions (`src/actions/ai.ts`)

New file with four server actions. Each: checks session, fetches item by ID with ownership check (`getItemById`), builds a prompt, calls `callHaiku`, returns `{ success, data?, error? }`.

**`suggestTags(itemId: string)`**
- Builds prompt from item title + content/url/description (truncated)
- Returns `{ success, data: string[] }` — array of 3–6 suggested tag names
- Parse Haiku's response as a newline- or comma-separated list

**`explainCode(itemId: string)`**
- Only valid for snippet/command types
- Returns `{ success, data: string }` — plain-English explanation

**`summarizeItem(itemId: string)`**
- Valid for note/prompt types
- Returns `{ success, data: string }` — 2–3 sentence summary

**`optimizePrompt(itemId: string)`**
- Only valid for prompt type
- Returns `{ success, data: string }` — rewritten prompt

For `suggestTags` called from the create form (no itemId yet): accept a `{ title, content, typeId }` payload instead. Add an overload or second action `suggestTagsFromContent({ title, content, typeId })`.

---

## Step 4 — TagSelector Enhancement (`src/components/items/TagSelector.tsx`)

Add two optional props:
- `suggestedTags?: string[]` — AI-suggested tags to display as clickable chips
- `onSuggestionAccepted?: (tag: string) => void` — called when user clicks a suggestion (so parent can remove it from the list)

Render suggested tags below the tag input as a row of chips with a "Suggestions:" label. Clicking a chip calls `addTag(tag)` internally (which adds it to selectedTags + hidden inputs) and calls `onSuggestionAccepted(tag)`.

---

## Step 5 — Auto-Tag in ItemForm (`src/components/items/ItemForm.tsx`)

Add to the form's tag section:

- State: `aiTagSuggestions: string[]`
- A "Suggest tags" button (subtle — `variant="ghost"`, small) rendered inline next to the Tags label
- `isPendingTags` transition state for loading
- On click: call `suggestTagsFromContent({ title, content, typeId })` server action; update `aiTagSuggestions` state with result
- Pass `suggestedTags={aiTagSuggestions}` and `onSuggestionAccepted={(tag) => setAiTagSuggestions(prev => prev.filter(t => t !== tag))}` to `TagSelector`
- Show inline error below Tags if the action fails
- Button is disabled if title is empty (nothing to suggest from)

---

## Step 6 — Detail Page AI Components

Three new client components in `src/components/items/`:

**`AiCodeExplainer.tsx`** — for snippet/command
- Button: "Explain this code"
- On click: calls `explainCode(itemId)` server action
- Shows result in a styled `<div>` below the button with prose styling
- Loading: button label changes to "Explaining…" and is disabled

**`AiSummary.tsx`** — for note/prompt
- Button: "Summarize"
- On click: calls `summarizeItem(itemId)`
- Shows result inline

**`AiPromptOptimizer.tsx`** — for prompt only
- Button: "Optimize prompt"
- On click: calls `optimizePrompt(itemId)`
- Shows result in a pre-formatted block with a `CopyButton` alongside it

All three: show an inline error message on failure. Results displayed below the existing content section, above Tags.

---

## Step 7 — Detail Page Integration (`src/app/(app)/items/[id]/page.tsx`)

Add AI components after the content block and before the tags section, gated by type:

- `system_snippet` / `system_command` → `<AiCodeExplainer itemId={item.id} />`
- `system_note` → `<AiSummary itemId={item.id} />`
- `system_prompt` → `<AiSummary itemId={item.id} />` + `<AiPromptOptimizer itemId={item.id} />`

These are client components so they render a button by default with no server-side cost.

---

## Step 8 — CLAUDE.md Update

Document: `ANTHROPIC_API_KEY` secret required; `src/lib/anthropic.ts` utility; `src/actions/ai.ts` server actions; AI components location.

---

## Verification

1. Set `ANTHROPIC_API_KEY` secret via `wrangler secret put ANTHROPIC_API_KEY`
2. Deploy with `npm run deploy`
3. Create a snippet — click "Suggest tags", verify suggestions appear as chips, click one to add it
4. View a snippet detail — click "Explain this code", verify explanation appears
5. View a note detail — click "Summarize", verify summary appears
6. View a prompt detail — click "Summarize" and "Optimize prompt", verify both work; copy the optimized prompt
7. Test with no content (empty item) — verify graceful handling
8. Test with invalid/missing API key — verify error message appears inline
