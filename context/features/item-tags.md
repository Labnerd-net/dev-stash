# Plan: Item Tags

## Overview

Wire up the existing `tags` and `item_tags` schema tables to the UI and server actions. Tags are user-scoped, reusable across items, and managed via a chip/pill input in `ItemForm`. They display as badges on `ItemRow` (list view) and on the item detail page.

No schema changes or migrations are required.

---

## Step 1 — Tag Query Helpers (`src/lib/tag-queries.ts`)

Create a new file with three helpers:

- `getUserTags(userId)` — returns all `{ id, name }` tags for a user; used to populate TagSelector suggestions
- `getTagsForItem(itemId, userId)` — returns `string[]` of tag names for a single item; used on edit and detail pages
- `getTagsForItems(itemIds, userId)` — returns `Record<string, string[]>` (itemId → names[]); used in type list pages to avoid N+1 queries

For `getTagsForItems`: query `item_tags` joined to `tags` where `tags.userId = userId` and `item_tags.itemId IN (itemIds)`. Build the record map in JS.

---

## Step 2 — TagSelector Component (`src/components/items/TagSelector.tsx`)

Client component. Props:
```ts
{
  userTags: { id: string; name: string }[];
  initialTagNames?: string[];
}
```

Behavior:
- Maintains `selectedTags: string[]` in state, initialized from `initialTagNames`
- Renders each selected tag as a removable pill chip
- Text input below the chips; on Enter or comma, the trimmed lowercase value is added to the list (if not already present and not empty)
- As the user types, show a dropdown of matching `userTags` (filter by prefix, case-insensitive); clicking a suggestion adds it
- Hidden inputs: one `<input type="hidden" name="tagName" value={tag} />` per selected tag
- Hidden sentinel: `<input type="hidden" name="hasTagSelector" value="1" />`
- Cap tag names at 50 characters; ignore whitespace-only entries

---

## Step 3 — Server Actions (`src/actions/items.ts`)

### `createItem`

After the item row is inserted (before `revalidateItemPaths`):

1. Read `rawTagNames = formData.getAll("tagName") as string[]`
2. Normalize: `trim().toLowerCase()`, filter empty and >50 chars, deduplicate
3. If any tags: for each name, check `db.select` from `tags` where `userId = userId AND name = name`; if not found, insert a new tag row (use `crypto.randomUUID()` for id)
4. Bulk insert `itemTags` rows linking `itemId` to each resolved `tagId`

### `updateItem`

After the item row is updated, check sentinel `formData.get("hasTagSelector") === "1"`:

1. Normalize tag names (same as above)
2. Upsert tags by name for this user (same lookup+insert logic)
3. Delete all existing `itemTags` where `itemId = id`
4. Re-insert `itemTags` for the new tag set (empty = clear all tags)

---

## Step 4 — ItemForm (`src/components/items/ItemForm.tsx`)

Add props:
```ts
userTags?: { id: string; name: string }[];
initialTagNames?: string[];
```

Render `<TagSelector userTags={userTags ?? []} initialTagNames={initialTagNames} />` after the description field, always (not gated on a condition — tags apply to all item types).

---

## Step 5 — ItemRow (`src/components/items/ItemRow.tsx`)

Add prop `tags?: string[]`. If non-empty, render a row of small pill badges below the preview line. Badges use `bg-muted text-muted-foreground text-xs rounded px-1.5 py-0.5`.

---

## Step 6 — ItemList (`src/components/items/ItemList.tsx`)

Add prop `tagsMap?: Record<string, string[]>`. Pass `tagsMap?.[row.item.id] ?? []` to each `<ItemRow>`.

---

## Step 7 — Type List Pages (7 files)

For each of: `snippets`, `prompts`, `notes`, `commands`, `files`, `images`, `links`:

1. Import `getTagsForItems` from `@/lib/tag-queries`
2. After `getItemsByType`, build `itemIds = itemList.map(r => r.item.id)`
3. Fetch `tagsMap = await getTagsForItems(itemIds, session.user.id)` (skip if `itemIds` is empty)
4. Pass `tagsMap` to `<ItemList>`

---

## Step 8 — New Item Page (`src/app/(app)/items/new/page.tsx`)

Add `getUserTags(session.user.id)` to the existing `Promise.all`. Pass result as `userTags` to `<ItemForm>`.

---

## Step 9 — Edit Item Page (`src/app/(app)/items/[id]/edit/page.tsx`)

Add `getUserTags(session.user.id)` and `getTagsForItem(id, session.user.id)` to the existing `Promise.all`. Pass `userTags` and `initialTagNames` to `<ItemForm>`.

---

## Step 10 — Item Detail Page (`src/app/(app)/items/[id]/page.tsx`)

Add `getTagsForItem(id, session.user.id)` to the existing `Promise.all`. Render a tags section (pattern mirrors the collections section): a label row and a `flex flex-wrap gap-1.5` of non-link badge chips.

---

## Step 11 — Tests (`tests/item-tags.test.ts`)

Write unit/integration tests covering:
- Tag name normalization (trim, lowercase, dedup, empty filter, 50-char cap)
- `createItem` with new tags creates tag rows and itemTag rows
- `updateItem` replaces tags atomically (old tags removed, new ones added)
- `updateItem` with no tags clears all itemTag rows for the item

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/tag-queries.ts` | Create |
| `src/components/items/TagSelector.tsx` | Create |
| `src/actions/items.ts` | Modify |
| `src/components/items/ItemForm.tsx` | Modify |
| `src/components/items/ItemRow.tsx` | Modify |
| `src/components/items/ItemList.tsx` | Modify |
| `src/app/(app)/snippets/page.tsx` | Modify |
| `src/app/(app)/prompts/page.tsx` | Modify |
| `src/app/(app)/notes/page.tsx` | Modify |
| `src/app/(app)/commands/page.tsx` | Modify |
| `src/app/(app)/files/page.tsx` | Modify |
| `src/app/(app)/images/page.tsx` | Modify |
| `src/app/(app)/links/page.tsx` | Modify |
| `src/app/(app)/items/new/page.tsx` | Modify |
| `src/app/(app)/items/[id]/edit/page.tsx` | Modify |
| `src/app/(app)/items/[id]/page.tsx` | Modify |
| `tests/item-tags.test.ts` | Create |
