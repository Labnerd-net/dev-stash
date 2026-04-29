# Plan: Favorites and Pins

## Context

Phase 3 item 11. Items have `isFavorite` and `isPinned` boolean columns in the DB schema already; collections have `isFavorite`. No migration is needed. The task is purely UI + server actions + query tweaks.

Decisions from spec:
- Favorites page = items only (not collections)
- Favorited collections = visually flagged in the collections grid only
- Pinned items = bubble to top of type list **and** show a pin icon in the row

---

## Files to Create

### `src/actions/favorites.ts`
Three server actions, each auth-checked and ownership-verified:
- `toggleItemFavorite(itemId)` — flip `isFavorite` on the item, revalidate the item's type path and `/favorites`
- `toggleItemPin(itemId)` — flip `isPinned` on the item, revalidate the item's type path
- `toggleCollectionFavorite(collectionId)` — flip `isFavorite` on the collection, revalidate `/collections`

Pattern: fetch current value, update to opposite, revalidatePath. Same ownership/auth pattern as `src/actions/items.ts`.

### `src/components/items/FavoriteItemButton.tsx`
Client component. Props: `itemId: string`, `isFavorite: boolean`.
- Renders a heart icon (Heart from lucide-react), filled when `isFavorite`
- On click: calls `toggleItemFavorite`, then `router.refresh()`
- Uses `useTransition` to disable during pending state

### `src/components/items/PinItemButton.tsx`
Client component. Props: `itemId: string`, `isPinned: boolean`.
- Renders a pin icon (Pin from lucide-react), colored/filled when `isPinned`
- On click: calls `toggleItemPin`, then `router.refresh()`
- Uses `useTransition` to disable during pending state

### `src/components/collections/FavoriteCollectionButton.tsx`
Client component. Props: `collectionId: string`, `isFavorite: boolean`.
- Same heart icon pattern as FavoriteItemButton
- Calls `toggleCollectionFavorite`, then `router.refresh()`

### `src/app/(app)/favorites/page.tsx`
Server component. Page title "Favorites".
- Gets session, calls `getFavoriteItems(userId)` for items
- Calls `getTagsForItems(itemIds)` for tag display
- Renders using existing `ItemList` + `ItemRow` components with the tagsMap
- Empty state: "No favorites yet." with link to `/items/new`

---

## Files to Modify

### `src/lib/item-queries.ts`
1. `getItemsByType` — change `orderBy` from `desc(items.createdAt)` to `[desc(items.isPinned), desc(items.createdAt)]` so pinned items always surface first within their type.
2. Add `getFavoriteItems(userId)`:
   - items where `isFavorite = true` AND `userId = userId`
   - inner join itemTypes
   - orderBy `desc(items.createdAt)`
   - Return type `ItemWithType[]`

### `src/components/items/ItemRow.tsx`
- Add `FavoriteItemButton` and `PinItemButton` to the existing `shrink-0 flex items-center gap-2` action area (before the color dot and delete button)
- Add a pin icon badge (small, inline) in the title row when `item.isPinned` is true
- `row.item.isFavorite` and `row.item.isPinned` already available — no interface changes needed

### `src/components/collections/CollectionCard.tsx`
Restructure to allow a favorite button alongside the link:
- Change outer element from `<Link>` to `<div>` (keep same border/bg/rounded classes)
- Keep the color accent bar at the top
- Wrap the inner content `div` in a `<Link href=...>` covering the clickable area
- Add `FavoriteCollectionButton` in the card header row (right of the name/count row), outside the Link
- Add `isFavorite: boolean` to the interface

### `src/components/collections/CollectionGrid.tsx`
- Pass `isFavorite={c.collection.isFavorite}` to `CollectionCard`

### `src/components/app/SidebarNav.tsx`
- Add `{ label: "Favorites", href: "/favorites", icon: Heart }` to `navItems` (top entry)

---

## Verification

1. `npm run build` — no type errors
2. In browser:
   - Click heart on an item row → icon fills, router refreshes
   - Click pin on an item row → pin icon appears in title row, item moves to top of list on refresh
   - Navigate to `/favorites` → only favorited items shown
   - Click heart on a collection card → heart fills, does not navigate to collection
   - Sidebar shows "Favorites" link, active state works
