# Plan: Soft Delete and Trash

## Context
Backlog item #37. Currently all deletes are permanent and immediate. This adds a `deletedAt` soft-delete column to `items` and `collections`, redirects all delete actions to set that timestamp instead of hard-deleting, and adds a `/trash` page where records can be restored or permanently deleted. Records older than 30 days are purged lazily when `/trash` loads (no cron job needed for single-user).

---

## Step 1 — Schema

**`src/db/schema.ts`**
- Add `deletedAt: timestamp("deleted_at")` (nullable, no default) to both `items` and `collections` tables

Then run:
```
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Step 2 — Query helpers (add `isNull(deletedAt)` filter everywhere)

The pattern to add to every existing `where` clause: `isNull(items.deletedAt)` / `isNull(collections.deletedAt)`. Import `isNull` from `drizzle-orm`.

**`src/lib/item-queries.ts`** — update all 7 functions:
`getItemsByType`, `getItemIdsByType`, `getFavoriteItems`, `getItemById`, `getItemsByIds`, `getAllItemsForExport`, `searchItems`

Also add two new query helpers at the bottom:
- `getTrashedItems(userId)` — items where `isNotNull(items.deletedAt)`, ordered by `desc(items.deletedAt)`; join itemTypes
- `getTrashedItemsForPurge(userId)` — items where `deletedAt < now() - 30 days`; select `id`, `fileUrl`, `contentType` only

**`src/lib/collection-queries.ts`** — update all 8 functions:
`getCollections`, `getCollectionById`, `getCollectionItems`, `getLatestCollections`, `getCollectionsForItem`, `getAllCollectionsForUser`, `getAllItemsMinimal`

Also add:
- `getTrashedCollections(userId)` — collections where `isNotNull(collections.deletedAt)`, ordered by `desc(collections.deletedAt)`

**`src/lib/tag-queries.ts`** — add `isNull(items.deletedAt)` to `getItemsByTag()` where clause (it joins items)

**`src/app/(app)/page.tsx`** — add `isNull(items.deletedAt)` and `isNull(collections.deletedAt)` to the inline `db.select({ total: count() })` dashboard stat queries (4 inline queries at top of the page component)

---

## Step 3 — Modify existing delete actions to soft-delete

**`src/actions/items.ts`**
- `deleteItem`: replace `db.delete(items).where(...)` with `db.update(items).set({ deletedAt: new Date() }).where(...)`; remove the R2 deletion block (deferred to permanent delete); revalidate same paths
- `bulkDeleteItems`: same change — set `deletedAt` instead of hard delete; remove R2 cleanup block

**`src/actions/collections.ts`**
- `deleteCollection`: replace `db.delete(collections).where(...)` with `db.update(collections).set({ deletedAt: new Date() }).where(...)`

---

## Step 4 — New trash server actions

**New file: `src/actions/trash.ts`**

All actions require session + ownership check.

- `restoreItem(itemId)` — `db.update(items).set({ deletedAt: null }).where(and(eq(items.id, itemId), eq(items.userId, userId)))`; revalidate `"/"` and item type paths
- `restoreCollection(collectionId)` — same pattern for collections; revalidate `"/collections"`
- `permanentDeleteItem(itemId)` — fetch `fileUrl` first, then `db.delete(items).where(...)` (cascade handles itemCollections/itemTags), then delete R2 object if present (non-fatal); revalidate `"/trash"`
- `permanentDeleteCollection(collectionId)` — `db.delete(collections).where(...)` (cascade handles itemCollections); revalidate `"/trash"`
- `purgeExpiredTrash(userId)` — called server-side on trash page load; fetches items where `deletedAt < now() - 30 days`, deletes R2 objects for file/image items, then hard-deletes those rows; hard-deletes collections older than 30 days; no revalidation needed (called before render)
- `emptyTrash(userId)` — fetch all trashed file/image items for R2 cleanup, then `db.delete(items).where(and(eq(items.userId, userId), isNotNull(items.deletedAt)))` + same for collections; revalidate `"/trash"`

---

## Step 5 — Trash UI components

**New: `src/components/trash/TrashItemRow.tsx`** (client component)
- Props: `item: Item & { itemType: ItemType }`, `deletedAt: Date`
- Shows: type color dot, title, type name, "Deleted X days ago · Y days remaining"
- Buttons: "Restore" (calls `restoreItem`, `router.refresh()`) and "Delete permanently" (2-step confirm, calls `permanentDeleteItem`, `router.refresh()`)
- Both use `useTransition` for pending states

**New: `src/components/trash/TrashCollectionRow.tsx`** (client component)
- Same pattern for collections; calls `restoreCollection` / `permanentDeleteCollection`

**New: `src/components/trash/EmptyTrashButton.tsx`** (client component)
- 2-step confirm ("Empty Trash" → "Yes, delete all"); calls `emptyTrash`; `router.push("/trash")` on success

---

## Step 6 — Trash page

**New: `src/app/(app)/trash/page.tsx`** (server component)
- Auth check
- Call `purgeExpiredTrash(userId)` first (lazy purge before render)
- Fetch `getTrashedItems(userId)` and `getTrashedCollections(userId)` in parallel
- If both empty: render empty state ("Trash is empty")
- Render two sections: "Items (N)" and "Collections (N)", each as a `<ul>` of `TrashItemRow` / `TrashCollectionRow`
- "Empty Trash" button (via `EmptyTrashButton`) in page header, only shown when trash is non-empty

---

## Step 7 — Sidebar link

**`src/components/app/SidebarNav.tsx`**
- Add `{ label: "Trash", href: "/trash", icon: Trash2 }` to `navItems` (after Favorites, before type links) — import `Trash2` from `lucide-react`

---

## Reused utilities
- `isNull`, `isNotNull`, `and`, `eq` from `drizzle-orm` — already imported in query files
- `getCloudflareContext` from `@opennextjs/cloudflare` — already used in `deleteItem` for R2
- `useTransition`, `useRouter` — already used in all button components
- `buttonVariants` from `@/lib/button-variants` — for server-component link buttons

---

## Verification
1. `npm run build` — must pass with no type errors
2. Delete an item → confirm it vanishes from its type list, search, favorites, recently used, collection membership display
3. Visit `/trash` → item appears with correct date and days remaining
4. Restore → item reappears in its type list
5. Delete permanently from trash → row gone, `/api/files/[id]` returns 404 for file items
6. Empty Trash button → all trashed records gone
7. Manually set `deletedAt = now() - 31 days` in DB → load `/trash` → record is purged (not shown, gone from DB)
8. Dashboard item counts do not include trashed items
