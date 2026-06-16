# Plan: Security Fixes

## Context

Four security issues from the backlog audit (backlog #1–4). Three are real attack vectors, one is attack-surface reduction. Branch: `claude/fix/security-fixes`.

---

## Fix #1 — XSS: Switch sanitizeHtml to allowlist

**File:** `src/lib/html-utils.ts`

`sanitizeHtml` already runs at write time in `createItem`/`updateItem` for note content. However it uses a **blocklist** (remove known-bad tags), which can be bypassed by malformed HTML. Replace with an **allowlist** that only keeps tags TipTap StarterKit actually produces, stripping all attributes.

Tags to allow: `p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, strong, em, s, br, hr`

Implementation — two regex passes:
1. Strip all attributes from every tag: `<tagname attr="...">` → `<tagname>`
2. Remove any tag not in the allowlist (including closing tags for unknown tags)

Pure string/regex — no DOM, no new dependencies. Works in Cloudflare Workers. No changes needed in callers.

---

## Fix #2 — R2 shared key on duplicate

**File:** `src/actions/items.ts` — `duplicateItem` (~line 391)

Currently copies `fileUrl`, `fileName`, `fileSize`, `contentType: "file"` from source to duplicate. Both rows share the same R2 key; permanent-deleting either one orphans the other.

In the `db.insert(items).values({...})` call, change:
- `fileUrl: null`
- `fileName: null`
- `fileSize: null`
- `contentType: "text"` (was `item.contentType`)

The item detail page already handles `fileUrl === null` gracefully — the file section simply doesn't render. No UI change needed.

---

## Fix #3 — Validate fileKey exists in R2

**File:** `src/actions/items.ts` — `createItem` and `updateItem`

`getCloudflareContext` is already imported (line 6). After each existing prefix-ownership check, add a `head()` call to confirm the object exists before writing to DB.

**createItem** (after line 92, before `db.insert`):
```ts
const { env } = getCloudflareContext();
const r2Obj = await env.dev_stash_files.head(fileKey!);
if (!r2Obj) return { success: false, error: "File not found — please re-upload" };
```

**updateItem** (after line 167, before `fileUpdateFields`):
```ts
if (replacingFile) {
  const { env } = getCloudflareContext();
  const r2Obj = await env.dev_stash_files.head(newFileKey!);
  if (!r2Obj) return { success: false, error: "File not found — please re-upload" };
}
```

---

## Fix #4 — Remove purgeExpiredTrash from server action exports

`purgeExpiredTrash` is an exported `"use server"` function that performs irreversible DELETEs. It's only called from one place: `src/app/(app)/trash/page.tsx` (a server component).

**New file: `src/lib/trash-purge.ts`**
- Plain `export async function purgeExpiredTrash()` — no `"use server"`
- Move the full session check + 30-day purge logic here verbatim from `trash.ts`

**`src/actions/trash.ts`:** Delete `purgeExpiredTrash` entirely.

**`src/app/(app)/trash/page.tsx`:** Update import:
```ts
import { purgeExpiredTrash } from "@/lib/trash-purge";
```

Server component calling a plain async function is fine — no behavior change.

---

## Verification

1. `npm run build` — no type errors
2. Create a note with `<script>alert(1)</script>` via TipTap → view detail page → no alert fires, script tag absent from DOM
3. Duplicate a file/image item → duplicate has no file section; original file still downloads
4. DevTools: intercept a file item create/edit, change `fileKey` to a fake key → action returns error, no DB record created
5. `grep -rn "purgeExpiredTrash" src/` → appears only in `src/lib/trash-purge.ts` and `src/app/(app)/trash/page.tsx`
