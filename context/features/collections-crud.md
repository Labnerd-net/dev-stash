# Plan: Collections CRUD

## Context

Implementing roadmap item 7 (Phase 2). The database schema for `collections` and `itemCollections` already exists and is migrated. The work is entirely UI + server actions + query helpers. The feature follows the established Items CRUD patterns exactly.

Key resolved decisions:
- Collection create/edit uses dedicated pages (not modals)
- Items can be added to a collection during item creation (`/items/new`)
- Sidebar shows latest 10 collections by `updatedAt desc`
- Dominant type color = most common item type by count; neutral if empty

---

## Implementation Order

### Phase 1 — Foundation (no UI dependencies)

**1. `src/lib/collection-schemas.ts`** (new)
Zod schemas mirroring `item-schemas.ts`:
- `createCollectionSchema`: `name` (required, max 255), `description` (optional)
- `updateCollectionSchema`: extends create + `id` + `isFavorite` with `.transform(v => v === "true")`
- `deleteCollectionSchema`: `id` only
- Export types: `CreateCollectionInput`, `UpdateCollectionInput`

**2. `src/lib/collection-queries.ts`** (new)
All queries enforce `userId` ownership. Functions:
- `getCollections(userId)` — two-query approach: (1) LEFT JOIN itemCollections + count, grouped by collection.id; (2) `SELECT collectionId, color, COUNT(*) FROM itemCollections JOIN items JOIN itemTypes WHERE collectionId IN [...] GROUP BY collectionId, color ORDER BY count DESC` — app-side reduce to pick first per collectionId as dominant color. Returns `CollectionWithMeta[]`.
- `getCollectionById(id, userId)` — single row or null
- `getCollectionItems(collectionId, userId)` — items in collection, verifying collection ownership, returns `ItemWithType[]` (same shape as `item-queries.ts`)
- `getLatestCollections(userId, limit = 10)` — `{ id, name }[]` ordered by `updatedAt desc`
- `getCollectionsForItem(itemId, userId)` — `{ id, name }[]` for item detail page
- `getAllCollectionsForUser(userId)` — `{ id, name }[]` for multi-select checkboxes
- `getAllItemsMinimal(userId)` — `{ id, title, typeId, typeColor }[]` for collection form item picker
- Export type: `CollectionWithMeta` derived from `getCollections` return

**3. `src/actions/collections.ts`** (new)
Mirror `items.ts` pattern. All actions:
- `"use server"`, accept `FormData`, auth via `auth.api.getSession`
- Zod `.safeParse(Object.fromEntries(formData))` for main fields
- `formData.getAll("collectionId")` separately for membership arrays (NOT via Zod)
- Return `{ success, data?, error? }`

Functions:
- `createCollection(formData)` — insert collection → insert `itemCollections` rows for selected items → `revalidatePath("/collections")`
- `updateCollection(formData)` — update collection with ownership check → DELETE all `itemCollections WHERE collectionId = id` → re-insert from `getAll("collectionId")` → revalidate `/collections` + `/collections/${id}`
- `deleteCollection(formData)` — delete with ownership check (cascade handles `itemCollections`) → `revalidatePath("/collections")`
- `removeItemFromCollection(formData)` — deletes single `itemCollections` row; verifies collection ownership → revalidates `/collections/${collectionId}`

### Phase 2 — Collection Components

**4. `src/components/collections/DeleteCollectionButton.tsx`** (new, `'use client'`)
Mirror `DeleteItemButton`: `window.confirm` → `deleteCollection` action → `onSuccess()` callback.

**5. `src/components/collections/DeleteCollectionRedirect.tsx`** (new, `'use client'`)
Mirror `DeleteItemRedirect`: wraps `DeleteCollectionButton`, calls `router.push(redirectTo)` on success.

**6. `src/components/collections/CollectionForm.tsx`** (new, `'use client'`)
Props: `mode: "create" | "edit"`, `allCollections?: ...` (unused — this is the collection form), `allItems: { id, title, typeId, typeColor }[]`, `initialValues?: { id, name, description }`, `currentItemIds?: string[]`.

State: `isPending` via `useTransition`, `error`, `selectedItemIds: Set<string>` from `currentItemIds`.

Submit: `new FormData(formRef.current)` → call `createCollection` or `updateCollection` in transition. Checkboxes with `name="collectionId"` appear naturally in FormData. On success `router.push('/collections/' + id)`.

Item checklist: scrollable, each item is `<input type="checkbox" name="collectionId" value={item.id} checked={selectedItemIds.has(item.id)}>`. Controlled state for UI feedback.

**7. `src/components/collections/CollectionCard.tsx`** (new, server component)
Props: `collection: { id, name, description, updatedAt }`, `itemCount: number`, `dominantColor: string | null`.
Renders: colored accent strip (`dominantColor ?? "#888"`), name, description truncated, item count badge. Entire card is a `<Link href="/collections/${id}">`.
Import `buttonVariants` from `@/lib/button-variants` if needed.

**8. `src/components/collections/CollectionGrid.tsx`** (new, server component)
Props: `collections: CollectionWithMeta[]`. Maps to `CollectionCard`. CSS grid (2–3 col). Empty state with "Create your first collection" link to `/collections/new`.

### Phase 3 — Collections Pages

**9. `src/app/(app)/collections/page.tsx`** (replace stub)
Server component. Auth check. Calls `getCollections(userId)`. Renders header + "New Collection" link (`buttonVariants` from `@/lib/button-variants`) + `CollectionGrid`.

**10. `src/app/(app)/collections/new/page.tsx`** (new)
Server component. Auth check. Calls `getAllItemsMinimal(userId)`. Renders page header + `CollectionForm mode="create" allItems={...}`.

**11. `src/app/(app)/collections/[id]/page.tsx`** (new)
Server component. `await params`. Parallel: `getCollectionById` + `getCollectionItems`. `notFound()` if null. Renders: name, description, item count, `ItemList items={collectionItems}` (reuse existing), `DeleteCollectionRedirect redirectTo="/collections"`, edit link with `buttonVariants`.

**12. `src/app/(app)/collections/[id]/edit/page.tsx`** (new)
Server component. `await params`. Parallel: `getCollectionById` + `getCollectionItems` + `getAllItemsMinimal`. `notFound()` if null. Renders `CollectionForm mode="edit"` with `initialValues`, `currentItemIds`, `allItems`.

### Phase 4 — Item Form Collection Selector

**13. `src/components/items/CollectionSelector.tsx`** (new, `'use client'`)
Props: `collections: { id, name }[]`, `initialSelectedIds?: string[]`.
Controlled checkboxes with `name="collectionId"`. State: `selectedIds: Set<string>`. Labeled "Add to Collections". Only renders if `collections.length > 0`.

**14. Modify `src/components/items/ItemForm.tsx`**
Add props: `collections?: { id, name }[]`, `initialCollectionIds?: string[]`. Render `<CollectionSelector>` below description field when `collections` is provided. No other changes.

**15. Modify `src/actions/items.ts`**
In `createItem`: after inserting item, call `formData.getAll("collectionId")` as `string[]`; for each ID insert an `itemCollections` row. Add `revalidatePath("/collections")`.
In `updateItem`: after updating item, delete all `itemCollections WHERE itemId = id`, then re-insert from `getAll("collectionId")`. Add `revalidatePath("/collections")`.

**16. Modify `src/app/(app)/items/new/page.tsx`**
Add `getAllCollectionsForUser` to the parallel fetch. Pass `collections` to `ItemForm`.

**17. Modify `src/app/(app)/items/[id]/edit/page.tsx`**
Add `getAllCollectionsForUser` + `getCollectionsForItem` to parallel fetch. Pass both to `ItemForm`.

**18. Modify `src/app/(app)/items/[id]/page.tsx`**
Add `getCollectionsForItem(id, userId)` to parallel fetch. Render collection badge links below item content if any.

### Phase 5 — Sidebar

**19. `src/components/app/SidebarNav.tsx`** (new, `'use client'`)
Extract the `usePathname`-dependent nav rendering from `Sidebar.tsx`. Props: `navItems: { href, label, icon }[]`. Handles active state.

**20. Modify `src/components/app/Sidebar.tsx`**
Remove `'use client'`. Add `async`. Add `userId: string` prop. Call `getLatestCollections(userId)`. Render `<SidebarNav>` + existing collections section + the 10 collection links. Collection links are plain `<Link>` elements (no active state needed).

**21. Modify `src/app/(app)/layout.tsx`**
Pass `userId={session.user.id}` to `<Sidebar>`.

### Phase 6 — Header

**22. Modify `src/components/app/Header.tsx`**
Wire the dead "New Collection" button to `router.push('/collections/new')`.

---

## Critical Implementation Notes

### Dominant Color Query (tricky)
Two queries for `getCollections`: first gets collections+counts via LEFT JOIN. Second (only run if there are results) gets `(collectionId, color, COUNT)` grouped from `itemCollections JOIN items JOIN itemTypes WHERE collectionId IN [ids]`. In app code, reduce to `Map<collectionId, color>` taking first occurrence (Drizzle's `orderBy(desc(count(...)))` ensures highest count is first).

### FormData Checkbox Array (tricky)
`Object.fromEntries(formData)` loses duplicate keys. All actions handling `collectionId` must call `formData.getAll("collectionId")` separately after the Zod parse. Unchecked boxes don't appear in FormData — "replace all memberships on save" is the correct semantic.

### Sidebar Server/Client Split (tricky)
`Sidebar.tsx` currently uses `usePathname`. Extract nav active-state logic to `SidebarNav.tsx` (`'use client'`). `Sidebar.tsx` becomes an `async` server component. The layout already has the session, so `userId` is passed down as a prop.

### `buttonVariants` Import Rule
In server components, always import `buttonVariants` from `@/lib/button-variants`, NOT from `@/components/ui/button` (which has `'use client'` and throws at runtime).

---

## Verification

1. `npm run build` — must pass with no errors
2. Manual browser testing per spec:
   - Create a collection → appears in grid and sidebar
   - Edit collection name/description → reflects on detail page
   - Delete collection → items unaffected, collection removed from sidebar
   - Create item with a collection selected → item shows in that collection's detail
   - Edit item and change collections → memberships update
   - Item detail shows collection badges with working links
   - Sidebar shows latest 10 collections; updates on create/edit/delete
   - `/collections/[id]` shows all items in collection with empty state when none
