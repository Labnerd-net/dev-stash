# Plan: Items CRUD

## Context

Items are the core data type in DevStash. All other MVP features (collections, search, tags) depend on items existing. The shell and route stubs are already in place; this feature fills them with real data.

Spec decisions:
- Plain textarea for content (no editor libs yet)
- List view
- `/items/new` dedicated page for creation
- Tags deferred
- Delete: remove join records, then the item; block delete if no cascade issue

---

## Implementation Order

### 1. Add zod to package.json

`zod` is currently a transitive dep via `better-auth`. Declare it explicitly:

```bash
npm install zod
```

---

### 2. `src/lib/item-type-map.ts` (new)

Hardcoded map of route slug → seeded type ID. Safe because seed uses deterministic IDs (`system_snippet`, etc.).

```typescript
export const ITEM_TYPE_MAP = {
  snippets: { typeId: "system_snippet", label: "Snippets", singularLabel: "Snippet" },
  prompts:  { typeId: "system_prompt",  label: "Prompts",  singularLabel: "Prompt"  },
  notes:    { typeId: "system_note",    label: "Notes",    singularLabel: "Note"    },
  commands: { typeId: "system_command", label: "Commands", singularLabel: "Command" },
  files:    { typeId: "system_file",    label: "Files",    singularLabel: "File"    },
  images:   { typeId: "system_image",   label: "Images",   singularLabel: "Image"   },
  links:    { typeId: "system_url",     label: "Links",    singularLabel: "Link"    },
} as const;

// Inverse map for revalidatePath in server actions
export const TYPE_ID_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(ITEM_TYPE_MAP).map(([slug, v]) => [v.typeId, slug])
);

// Field visibility per type
export const TYPE_FIELD_CONFIG: Record<string, {
  hasContent: boolean;
  hasLanguage: boolean;
  hasUrl: boolean;
}> = {
  system_snippet: { hasContent: true,  hasLanguage: true,  hasUrl: false },
  system_prompt:  { hasContent: true,  hasLanguage: false, hasUrl: false },
  system_note:    { hasContent: true,  hasLanguage: false, hasUrl: false },
  system_command: { hasContent: true,  hasLanguage: false, hasUrl: false },
  system_file:    { hasContent: false, hasLanguage: false, hasUrl: false },
  system_image:   { hasContent: false, hasLanguage: false, hasUrl: false },
  system_url:     { hasContent: false, hasLanguage: false, hasUrl: true  },
};
```

---

### 3. `src/lib/item-schemas.ts` (new)

Zod schemas for create/update/delete. Separate file so `ItemForm` can import types without pulling in server-only code.

- `createItemSchema`: title (required), typeId (required), content?, url? (url or empty string), description?, language?
- `updateItemSchema`: extends create + id, isFavorite?, isPinned?
- `deleteItemSchema`: id only
- Export inferred types

---

### 4. `src/lib/item-queries.ts` (new)

Server-only DB read helpers to avoid duplicating Drizzle queries across pages.

```typescript
import { db } from "@/db";
import { items, itemTypes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getItemsByType(userId: string, typeId: string) {
  return db
    .select({ items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.userId, userId), eq(items.typeId, typeId)))
    .orderBy(desc(items.createdAt));
}

export async function getItemById(id: string, userId: string) {
  const rows = await db
    .select({ items, itemType: itemTypes })
    .from(items)
    .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
    .where(and(eq(items.id, id), eq(items.userId, userId)));
  return rows[0] ?? null;
}
```

---

### 5. `src/actions/items.ts` (new)

`"use server"` file with three exported actions. All accept `FormData`, return `{ success: boolean; data?: { id: string }; error?: string }`.

**`createItem(formData)`:**
1. Auth check via `auth.api.getSession({ headers: await headers() })`
2. `createItemSchema.safeParse(Object.fromEntries(formData))`
3. Insert with `id: crypto.randomUUID()`, `contentType: "text"`, `userId`, `updatedAt: new Date()`
4. Empty string `url` → `null`
5. `revalidatePath("/")` + `revalidatePath("/" + TYPE_ID_TO_SLUG[typeId])`
6. Return `{ success: true, data: { id } }`

**`updateItem(formData)`:**
1. Auth + parse with `updateItemSchema`
2. Fetch item — verify ownership (`and(eq(items.id, id), eq(items.userId, userId))`) — 404 if missing
3. Update, revalidate, return `{ success: true }`

**`deleteItem(formData)`:**
1. Auth + parse with `deleteItemSchema`
2. Delete directly with `and(eq(items.id, id), eq(items.userId, userId))` — userId predicate handles ownership implicitly
3. `revalidatePath("/")` and all type paths (or pass typeId in formData for targeted revalidation)
4. Return `{ success: true }`

---

### 6. Components under `src/components/items/`

#### `ItemTypeSelector.tsx` (client)
Props: `types[]`, `value: string`, `onChange: (typeId: string) => void`
Renders a grid of clickable type cards (name + icon color dot). Highlights selected type.

#### `ItemForm.tsx` (client)
Props: `mode: "create" | "edit"`, `types[]`, `initialValues?`, `defaultTypeId?`

State: `selectedTypeId`, `error`, `isPending` (via `useTransition`)

On submit:
- Build `FormData` from form element ref (`new FormData(formRef.current)`)
- Call `createItem` or `updateItem`
- On success: `router.push(\`/items/${id}\`)`
- On error: set error state

Conditional fields driven by `TYPE_FIELD_CONFIG[selectedTypeId]`:
- `hasContent` → `<textarea name="content">`
- `hasLanguage` → `<select name="language">` (common languages list)
- `hasUrl` → `<input type="url" name="url">`
- Always show: `<textarea name="description">` (optional)

In edit mode, type selector is rendered as read-only (switching type deferred).

#### `ItemRow.tsx` (server)
Renders one list row: title as `<Link href="/items/{id}">`, content/url/description preview truncated, language badge, `<DeleteItemButton>`.

#### `DeleteItemButton.tsx` (client)
```typescript
"use client";
// useTransition + window.confirm
// Accepts: id, onSuccess?: () => void
// Builds FormData manually, calls deleteItem
// Calls onSuccess() on success (caller decides navigation)
```

On the list: `onSuccess` calls `router.refresh()`.
On the detail page: `onSuccess` calls `router.push("/snippets")` (type slug passed via prop).

#### `ItemList.tsx` (server)
Props: `items[]`, `label: string`
Renders `<ul>` of `<ItemRow>` or `<EmptyState>`. EmptyState includes a link to `/items/new`.

---

### 7. Pages (new)

#### `src/app/(app)/items/new/page.tsx`
Server component. Auth check. Fetch all item types (`or(isNull(userId), eq(userId, session.user.id))`). Render `<ItemForm mode="create" types={types} />`.

#### `src/app/(app)/items/[id]/page.tsx`
Server component. Auth + `getItemById`. `notFound()` if null. Render full item detail: title, type badge, content block (`<pre>` for code types, `<p>` for text), url link, description, Edit button (`<Link href="/items/{id}/edit">`), `<DeleteItemButton>`.

Note: `params` in Next.js 16 is a `Promise<{ id: string }>` — must `await params`.

#### `src/app/(app)/items/[id]/edit/page.tsx`
Server component. Auth + `getItemById`. Fetch types. Render `<ItemForm mode="edit" initialValues={...} types={types} defaultTypeId={item.typeId} />`.

---

### 8. Update type list pages (7 files, identical pattern)

Each becomes an async server component:
```typescript
const { typeId, label, singularLabel } = ITEM_TYPE_MAP.snippets; // change key per page
const itemList = await getItemsByType(session.user.id, typeId);
```
Renders page header with label + item count + "New {singularLabel}" button, then `<ItemList items={itemList} label={label} />`.

**Files:** snippets, prompts, notes, commands, files, images, links — all in `src/app/(app)/`.

---

### 9. Update dashboard — `src/app/(app)/page.tsx`

Convert to async server component. Auth via `getSession`. Four parallel count queries:
```typescript
await Promise.all([
  db.select({ total: count() }).from(items).where(eq(items.userId, id)),
  db.select({ total: count() }).from(collections).where(eq(collections.userId, id)),
  db.select({ total: count() }).from(items).where(and(eq(items.userId, id), eq(items.isFavorite, true))),
  db.select({ total: count() }).from(collections).where(and(eq(collections.userId, id), eq(collections.isFavorite, true))),
])
```
`count()` imported from `drizzle-orm`. Replace hardcoded `0` stats.

---

### 10. Update Header — `src/components/app/Header.tsx`

The Button uses `@base-ui/react/button` (no `asChild`). Header is already a client component. Use `useRouter`:

```typescript
const router = useRouter();
// ...
<Button size="sm" onClick={() => router.push("/items/new")}>New Item</Button>
```

---

## Files Summary

**New (12):**
- `src/lib/item-type-map.ts`
- `src/lib/item-schemas.ts`
- `src/lib/item-queries.ts`
- `src/actions/items.ts`
- `src/components/items/ItemTypeSelector.tsx`
- `src/components/items/ItemForm.tsx`
- `src/components/items/ItemRow.tsx`
- `src/components/items/DeleteItemButton.tsx`
- `src/components/items/ItemList.tsx`
- `src/app/(app)/items/new/page.tsx`
- `src/app/(app)/items/[id]/page.tsx`
- `src/app/(app)/items/[id]/edit/page.tsx`

**Modified (9):**
- `src/app/(app)/snippets/page.tsx`
- `src/app/(app)/prompts/page.tsx`
- `src/app/(app)/notes/page.tsx`
- `src/app/(app)/commands/page.tsx`
- `src/app/(app)/files/page.tsx`
- `src/app/(app)/images/page.tsx`
- `src/app/(app)/links/page.tsx`
- `src/app/(app)/page.tsx`
- `src/components/app/Header.tsx`

---

## Verification

1. `npm run build` — must pass with zero errors
2. Create an item of each type — verify it appears in the correct type list page
3. Edit an item — verify changes persist
4. Delete an item — `window.confirm` fires; item removed from list; dashboard count decrements
5. Navigate directly to another user's item URL — must get 404
6. Empty state — verify shown when a type has no items
