# Plan: Export Items and Collections

## Context

Users need a way to get their data out of DevStash. This feature adds JSON and Markdown ZIP export for all items and for individual collections, triggered from a new `/settings` page (all-items) and the collection detail page (per-collection).

Decisions locked in from the spec:
- Markdown export = ZIP file (one `.md` file per item)
- Collection export = user's choice of JSON or Markdown ZIP
- Export UI = `/settings` page for all-items; collection detail page for per-collection

---

## Step 1 — Install `fflate`

Install `fflate` (pure-JS zip library, works on Cloudflare Workers Edge runtime, no Node.js native bindings):

```
npm install fflate
```

---

## Step 2 — Add `getAllItemsForExport` query

In `src/lib/item-queries.ts`, add:

```ts
export async function getAllItemsForExport(userId: string)
```

Joins `items` + `itemTypes`, returns all fields needed for export (id, title, content, contentType, fileUrl, fileName, fileSize, url, description, language, isFavorite, isPinned, createdAt, updatedAt, typeName). Ordered by `createdAt desc`.

Reuse existing `getTagsForItems(itemIds[])` from `src/lib/tag-queries.ts` to fetch tags in a single query after fetching items.

---

## Step 3 — Create `src/lib/export.ts`

Shared formatting utilities:

- `stripHtml(html: string): string` — regex-based HTML tag remover for note content in Markdown output
- `buildJsonExport(items, tagsMap)` — returns a JS object `{ exportedAt, itemCount, items: [...] }` where each item includes all fields + `tags: string[]`. File/image items include `fileName`, `fileSize` but `content` is `null`.
- `buildMarkdownForItem(item, tags: string[])` — returns a single `.md` file string. Format:
  ```
  # {title}
  **Type:** {typeName}
  **Tags:** tag1, tag2
  **Created:** ISO date
  
  {content or description or fileName}
  ```
  Note items: content is HTML-stripped via `stripHtml`. File/image items: note filename and size only.
- `itemSlug(item)` — safe filename from title (lowercase, spaces→dashes, strip non-alphanumeric)

---

## Step 4 — API routes (Edge runtime)

### `src/app/api/export/items/route.ts`

`GET ?format=json|zip`

1. Session check via `auth.api.getSession`; return 401 if unauthenticated
2. Fetch all items via `getAllItemsForExport(userId)`
3. Fetch tags via `getTagsForItems(itemIds)`
4. If `format=json`: return `Response` with `Content-Type: application/json` and `Content-Disposition: attachment; filename="devstash-export-{date}.json"`
5. If `format=zip`: build zip with `fflate.zipSync`, one file per item named `{slug}.md`; return `Content-Type: application/zip` and `Content-Disposition: attachment; filename="devstash-export-{date}.zip"`

### `src/app/api/export/collections/[id]/route.ts`

`GET ?format=json|zip`

Same pattern but:
1. Verify collection ownership via `getCollectionById(id, userId)` — 404 if not found
2. Fetch items via existing `getCollectionItems(id, userId)`
3. Filename includes collection slug: `devstash-collection-{slug}-{date}.json|zip`

---

## Step 5 — Settings page

Create `src/app/(app)/settings/page.tsx` — server component.

- Session check + redirect pattern (same as other pages)
- Heading: "Settings"
- Section: "Export Your Data"
- Two buttons linking to `/api/export/items?format=json` and `/api/export/items?format=zip`
- Use `<a href="..." download>` wrapped in `buttonVariants` styling (same pattern as other pages using `buttonVariants` on Link elements) — simple anchor tags, no JS required
- Brief description of each format

---

## Step 6 — Collection detail page export buttons

In `src/app/(app)/collections/[id]/page.tsx`, add an export dropdown or two small buttons in the existing header action row (alongside Edit and Delete). Use `<a href={/api/export/collections/${id}?format=json} download>` and `<a href={/api/export/collections/${id}?format=zip} download>`.

Keep it tight — small "Export JSON" and "Export MD" buttons using `buttonVariants({ variant: "outline", size: "sm" })`.

---

## Step 7 — Sidebar Settings link

In `src/components/app/SidebarNav.tsx`, add a "Settings" nav item pointing to `/settings` using the `Settings` icon from `lucide-react`. Add it at the bottom of `navItems` or in a separate bottom section.

---

## Step 8 — Update `current-feature.md`

Fill in spec file, plan file, and branch fields.

---

## Files to create
- `src/lib/export.ts`
- `src/app/api/export/items/route.ts`
- `src/app/api/export/collections/[id]/route.ts`
- `src/app/(app)/settings/page.tsx`

## Files to modify
- `src/lib/item-queries.ts` — add `getAllItemsForExport`
- `src/app/(app)/collections/[id]/page.tsx` — add export buttons
- `src/components/app/SidebarNav.tsx` — add Settings link
- `context/current-feature.md` — fill in feature metadata

---

## Verification

1. Run `npm run build` — must pass with no errors
2. Navigate to `/settings` — export buttons visible
3. Click "Export as JSON" — browser downloads a `.json` file; open it and verify items + tags present
4. Click "Export as Markdown (ZIP)" — browser downloads `.zip`; verify individual `.md` files inside
5. Open a collection detail page — "Export JSON" and "Export MD" buttons visible
6. Export a collection — verify only that collection's items are in the file
7. Verify unauthenticated request to `/api/export/items?format=json` returns 401
