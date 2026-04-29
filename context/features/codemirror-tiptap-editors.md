# Plan: CodeMirror 6 + TipTap Editors

## Context

`ItemForm` uses a plain `<textarea>` for the `content` field on all item types that have content. This is the weakest part of the UX for a dev-knowledge tool. The packages are already installed; this feature wires them up. CodeMirror 6 replaces the textarea for code-oriented types (snippet, prompt, command). TipTap replaces it for note-type items.

Item detail page currently renders all content in a `<pre>` block. After this change, note content will be stored as HTML (TipTap output), so the detail page must render it correctly.

---

## Type Routing

| typeId           | Editor       | Language mode                    |
|------------------|--------------|----------------------------------|
| system_snippet   | CodeMirror   | from `language` field (reactive) |
| system_command   | CodeMirror   | plaintext (no language field)    |
| system_prompt    | CodeMirror   | plaintext (no language field)    |
| system_note      | TipTap       | n/a                              |
| system_file/image/url | (no content field) | —               |

---

## Step 1 — Create `CodeMirrorEditor.tsx`

**File:** `src/components/items/CodeMirrorEditor.tsx` (new)

- `'use client'` component
- Props: `value: string`, `language?: string`, `onChange: (value: string) => void`
- Use `EditorView` + `EditorState` from `@codemirror/view` / `@codemirror/state`
- Apply `oneDark` theme from `@codemirror/theme-one-dark`
- Language map (installed packages only; fallback to `[]` for unmapped):
  - `javascript`, `jsx` → `javascript()` from `@codemirror/lang-javascript`
  - `typescript`, `tsx` → `javascript({ typescript: true })`
  - `css` → `css()`
  - `html` → `html()`
  - `json` → `json()`
  - `python` → `python()`
  - `rust` → `rust()`
  - `sql` → `sql()`
  - `markdown` → `markdown()`
  - `c`, `cpp` → `cpp()`
- `useEffect` creates EditorView on mount, destroys on unmount
- Calls `onChange` on every document change via `EditorView.updateListener`
- Second `useEffect` watches `language` prop: dispatches a `StateEffect` to reconfigure the language compartment when `language` changes (use a `Compartment` from `@codemirror/state`)
- Styled to match the existing `inputClass` appearance (border, background, rounded, min-h matching `rows={10}`)

## Step 2 — Create `TipTapEditor.tsx`

**File:** `src/components/items/TipTapEditor.tsx` (new)

- `'use client'` component
- Props: `value: string`, `onChange: (value: string) => void`
- Use `useEditor` + `EditorContent` from `@tiptap/react`
- Extensions: `StarterKit` (includes bold, italic, headings, lists, code, codeBlock, paragraph)
  - Do NOT import `@tiptap/extension-code-block-lowlight` — `lowlight` is not in `package.json`
- `content: value` initial content — TipTap accepts both HTML and plain text; existing plain-text notes will be treated as a paragraph and displayed correctly
- `onUpdate: ({ editor }) => onChange(editor.getHTML())`
- Render a minimal toolbar above `EditorContent`:
  - Bold, Italic, H1/H2/H3 buttons, unordered list, ordered list, inline code, code block
  - Buttons toggle via `editor.chain().focus().<command>().run()`
  - Active state: `editor.isActive(...)` → highlight the button

## Step 3 — Update `ItemForm.tsx`

**File:** `src/components/items/ItemForm.tsx`

Changes:
1. Add `contentValue` state initialized from `initialValues?.content ?? ""`
2. Add `selectedLanguage` state initialized from `initialValues?.language ?? ""`
3. Change the language `<select>` from uncontrolled (`defaultValue`) to controlled (`value={selectedLanguage}` + `onChange={(e) => setSelectedLanguage(e.target.value)}`) — also remove `name="language"` from the select and add a hidden input `<input type="hidden" name="language" value={selectedLanguage} />` so FormData still picks it up
4. Replace the content `<textarea>` block with:
   ```
   const CODE_TYPE_IDS = ["system_snippet", "system_command", "system_prompt"]
   const NOTE_TYPE_IDS = ["system_note"]
   ```
   - If `CODE_TYPE_IDS` includes `selectedTypeId`: render `<CodeMirrorEditor>`
   - If `NOTE_TYPE_IDS` includes `selectedTypeId`: render `<TipTapEditor>`
   - Otherwise: keep existing `<textarea>` (future custom types)
   - In all `hasContent` cases, also render `<input type="hidden" name="content" value={contentValue} />`
5. When `selectedTypeId` changes, reset `contentValue` to `""` (only on create; in edit the type is locked)

## Step 4 — Update Item Detail Page

**File:** `src/app/(app)/items/[id]/page.tsx`

Current content block (line 84–91):
```tsx
<pre className="rounded-lg border border-border bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
  {item.content}
</pre>
```

Change:
- If `item.typeId === "system_note"`: render content as HTML using `dangerouslySetInnerHTML={{ __html: item.content }}` in a `<div>` with prose-compatible styling
- All other types: keep the existing `<pre>` block unchanged

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/items/CodeMirrorEditor.tsx` | New component |
| `src/components/items/TipTapEditor.tsx` | New component |
| `src/components/items/ItemForm.tsx` | Replace textarea, add editor routing, controlled language state |
| `src/app/(app)/items/[id]/page.tsx` | Render note content as HTML |

---

## Verification

1. Create a snippet — CodeMirror renders with JS syntax highlighting for `javascript`
2. Change language dropdown on snippet — highlighting mode updates live
3. Create a command — CodeMirror renders in plaintext mode
4. Create a note — TipTap toolbar visible; bold/italic/headings/lists work
5. Edit an existing code item — CodeMirror pre-filled with saved content
6. Edit an existing note item — TipTap pre-filled; existing plain-text renders as paragraph
7. Save both — item detail page shows formatted HTML for note, plain `<pre>` for code types
8. `npm run build` passes with no TypeScript errors
