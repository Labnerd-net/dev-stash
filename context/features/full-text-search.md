# Plan: Full-Text Search

## Context

The header search input has been a read-only stub since the shell was built. This implements Postgres full-text search across items (title, content, description) and tags, wires up the header input, and adds a dedicated search results page with type filtering.

---

## Steps

### 1. DB Migration — GIN index on items

Create `src/db/migrations/0003_search_gin_index.sql`:
```sql
CREATE INDEX "items_search_idx" ON "items" USING gin(
  to_tsvector('english',
    coalesce("title", '') || ' ' ||
    coalesce("content", '') || ' ' ||
    coalesce("description", '')
  )
);
```

Update `src/db/migrations/meta/_journal.json`: add entry with idx 3, tag `0003_search_gin_index`, current timestamp.

### 2. Schema — add expression index

In `src/db/schema.ts`, extend the `items` table's index array to include the GIN expression index alongside the existing `items_user_id_idx`, so `drizzle-kit` stays in sync:
```ts
index("items_search_idx").using("gin").on(
  sql`to_tsvector('english', coalesce(${table.title},'') || ' ' || coalesce(${table.content},'') || ' ' || coalesce(${table.description},''))`
)
```
Import `sql` from `drizzle-orm`.

### 3. `searchItems` query helper

Add to `src/lib/item-queries.ts`:

```ts
export async function searchItems(userId: string, query: string, typeId?: string) {
  // ...
}
```

Logic:
- Return `[]` immediately if `query.trim()` is empty.
- For queries ≤ 2 chars: use `ILIKE '%q%'` on `title` only (FTS stemming drops short tokens).
- For longer queries: use `websearch_to_tsquery` against the tsvector expression.
- In both cases, also match items whose tags contain the query substring (EXISTS subquery with ILIKE).
- Always filter by `userId`; filter by `typeId` when provided.
- `DISTINCT`, ordered by `createdAt DESC`, limited to 50.
- Return type matches existing `ItemWithType` shape (`{ item, itemType }`).

### 4. Search results page

Create `src/app/(app)/search/page.tsx` — server component.

```ts
// searchParams: { q?: string; type?: string }
```

- Validate `type` param against known system type IDs from `ITEM_TYPE_MAP`; ignore unknown values.
- If no `q`: render an empty-state prompt ("Enter a search term above to find your items").
- If `q` present: call `searchItems` + `getTagsForItems` (existing helper in `tag-queries.ts`).
- Render type filter chips row: "All" + one chip per entry in `ITEM_TYPE_MAP`. Active chip highlighted. Each chip is a `<Link>` to `/search?q=<q>&type=<typeId>` (or `/search?q=<q>` for "All").
- If results: render with `ItemList` (already handles the list + `ItemRow` + `tagsMap`).
- If no results: render "No items found for "<q>"" message.

### 5. Header — wire up search input

`src/components/app/Header.tsx` (already `"use client"`):

- Remove `readOnly` and `cursor-default` from the existing input.
- Wrap input in a `<form action="/search">` — native HTML form submit navigates to `/search?q=value` on Enter with no extra JS needed.
- Add `name="q"` to the input.
- Remove `readOnly` class tweak; keep all existing styling.
- No state or router changes needed — native form GET handles navigation.

---

## Files Modified

| File | Change |
|------|--------|
| `src/db/migrations/0003_search_gin_index.sql` | New — GIN index migration |
| `src/db/migrations/meta/_journal.json` | Add migration entry |
| `src/db/schema.ts` | Add GIN expression index to items table |
| `src/lib/item-queries.ts` | Add `searchItems` helper |
| `src/app/(app)/search/page.tsx` | New — search results page |
| `src/components/app/Header.tsx` | Wire search input via native form |

---

## Verification

1. Run `npm run build` — no TypeScript errors.
2. Start `npm run dev`.
3. Type a known item title in the header search and press Enter → lands on `/search?q=<title>` with the item listed.
4. Search for a tag name → items with that tag appear.
5. Search for text that only exists in an item's content/description → item appears.
6. Click a type chip → results filtered; chip is highlighted.
7. Submit empty query → empty-state prompt, no items.
8. Search for a term with no matches → "No items found" message.
