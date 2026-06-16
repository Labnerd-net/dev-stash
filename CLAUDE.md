# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Standard Next.js build
npm run lint     # Run ESLint
npm run preview  # Build + run locally as Cloudflare Worker (http://localhost:8787)
npm run deploy   # Build + deploy to Cloudflare Workers
```

No test runner is configured.

## Stack

- Next.js 16 (App Router) with React 19
- TypeScript (strict mode)
- Tailwind CSS v4 (via PostCSS)
- React Compiler enabled (`reactCompiler: true` in next.config.ts)

## Architecture

All authenticated routes live under the `src/app/(app)/` route group. The group layout (`src/app/(app)/layout.tsx`) handles session checks and renders the persistent shell (sidebar + header).

- Root layout (`src/app/layout.tsx`) — Geist fonts, dark class, no app chrome
- App layout (`src/app/(app)/layout.tsx`) — session guard, `<Sidebar>` + `<Header>` + `{children}`
- Sidebar: `src/components/app/Sidebar.tsx`
- Header: `src/components/app/Header.tsx`

Path alias `@/*` maps to `./src/*`.

ESLint uses `eslint-config-next` (core-web-vitals + typescript rules) with flat config format.

## Database

- DB client: `src/db/index.ts` — exports `db` (lazy Proxy singleton); import as `import { db } from "@/db"`
- Schema: `src/db/schema.ts`; migrations in `src/db/migrations/`
- Driver: `@neondatabase/serverless` + `drizzle-orm/neon-http`; requires `DATABASE_URL` (pooled) at runtime and `DATABASE_URL_UNPOOLED` (direct) for migrations
- Lazy init avoids build-time failures on Cloudflare Workers (Neon client can't be called at import time)

## File Uploads (R2)

- R2 bucket binding: `dev_stash_files` in `wrangler.jsonc`; typed in `worker-configuration.d.ts` (extends global `CloudflareEnv`)
- Access R2 in API routes and server actions via `getCloudflareContext().env.dev_stash_files` from `@opennextjs/cloudflare`
- Upload: `POST /api/upload` (`src/app/api/upload/route.ts`) — Edge runtime; validates size ≤25 MB and MIME type; stores object at `uploads/<userId>/<uuid>-<filename>`; returns `{ key, fileName, fileSize }`
- Download: `GET /api/files/[id]` (`src/app/api/files/[id]/route.ts`) — Edge runtime; ownership check via `getItemById`; streams from R2; images served `inline`, files as `attachment`
- Only the R2 object key is stored in the DB (`items.fileUrl`); download URLs are always `/api/files/<itemId>` — never the raw key
- `items.contentType` is `"file"` for file/image items, `"text"` for all others
- `deleteItem` fetches `fileUrl` before deleting the row, then deletes the R2 object; R2 failures are non-fatal (caught and ignored)
- `TYPE_FIELD_CONFIG` has `hasFile: boolean` — true for `system_file` and `system_image`; drives form and detail page conditionals

## AI Features

- Anthropic utility: `src/lib/anthropic.ts` — `callHaiku(systemPrompt, userContent)` uses native fetch; reads `ANTHROPIC_API_KEY` from `getCloudflareContext().env`; truncates content to 4000 chars; model `claude-haiku-4-5-20251001`
- Server actions: `src/actions/ai.ts` — `suggestTagsFromContent`, `explainCode`, `summarizeItem`, `optimizePrompt`; all require session + ownership check; all return `{ success, data?, error? }`
- All AI results are ephemeral — nothing is persisted to the database
- `ANTHROPIC_API_KEY` must be set as a Cloudflare Worker secret: `wrangler secret put ANTHROPIC_API_KEY`
- UI components: `AiCodeExplainer`, `AiSummary`, `AiPromptOptimizer` in `src/components/items/` — client components with loading/error states
- `TagSelector` accepts `suggestedTags?: string[]` and `onSuggestionAccepted?: (tag: string) => void` for AI-driven tag chips

## Auth

- Auth is handled by **better-auth** (`src/lib/auth.ts`) with the Drizzle adapter (`usePlural: true`)
- Client-side auth via `src/lib/auth-client.ts` — import `authClient` in client components
- Server-side session via `auth.api.getSession({ headers: await headers() })` in server components
- Route protection is in `src/middleware.ts` — uses Edge runtime (required for Cloudflare Workers); Next.js 16 added `proxy.ts` as a Node.js-runtime alternative but that is incompatible with Workers
- Sign-up is restricted by `ALLOWED_EMAILS` env var (comma-separated); empty = open to all

## Items

- Server actions for mutations: `src/actions/items.ts` — `createItem`, `updateItem`, `deleteItem`
- DB read helpers: `src/lib/item-queries.ts` — `getItemsByType`, `getItemById`, `searchItems`, `getFavoriteItems`
- Item type map (slug → seeded typeId): `src/lib/item-type-map.ts` — also exports `TYPE_FIELD_CONFIG` (which fields each type shows) and `TYPE_ID_TO_SLUG` (for revalidation)
- Seeded system type IDs are deterministic: `system_snippet`, `system_prompt`, `system_note`, `system_command`, `system_file`, `system_image`, `system_url`
- Item components: `src/components/items/` — `ItemForm`, `ItemList`, `ItemRow`, `ItemTypeSelector`, `DeleteItemButton`, `DeleteItemRedirect`, `FavoriteItemButton`, `PinItemButton`
- `Button` uses `@base-ui/react/button` — no `asChild` prop; use `buttonVariants` on `<Link>` elements instead
- Import `buttonVariants` from `@/lib/button-variants` in server components — NOT from `@/components/ui/button` (that file has `"use client"` and will throw at runtime)
- Item pages: `/items/new`, `/items/[id]`, `/items/[id]/edit` — `params` is a `Promise<{ id: string }>` in Next.js 16, must `await params`

## Collections

- Server actions for mutations: `src/actions/collections.ts` — `createCollection`, `updateCollection`, `deleteCollection`, `removeItemFromCollection`
- DB read helpers: `src/lib/collection-queries.ts` — `getCollections`, `getCollectionById`, `getCollectionItems`, `getLatestCollections`, `getCollectionsForItem`, `getAllCollectionsForUser`, `getAllItemsMinimal`
- Collection components: `src/components/collections/` — `CollectionForm`, `CollectionCard`, `CollectionGrid`, `DeleteCollectionButton`, `DeleteCollectionRedirect`, `FavoriteCollectionButton`
- Collection pages: `/collections`, `/collections/new`, `/collections/[id]`, `/collections/[id]/edit` — `params` is a `Promise<{ id: string }>` in Next.js 16, must `await params`
- Item→collection assignment uses `CollectionSelector` component (`src/components/items/CollectionSelector.tsx`) rendered inside `ItemForm`; checkbox field name is `collectionId`
- `CollectionSelector` renders a hidden `hasCollectionSelector=1` sentinel field; `updateItem` only syncs memberships when this field is present
- `CollectionForm` item picker uses hidden inputs (`name="collectionItemId"`) driven by React state — not raw checkbox names — to correctly represent selected set
- Sidebar is an async server component (`src/components/app/Sidebar.tsx`) that fetches latest 10 collections; nav active-state logic is in `src/components/app/SidebarNav.tsx` (`'use client'`)
- Sidebar state (collapse + mobile drawer) is managed by `SidebarContext` (`src/components/app/SidebarContext.tsx`, `'use client'`) — `SidebarProvider` wraps the whole app layout; `useSidebar()` hook used by `Header`, `SidebarWrapper`, `SidebarCloseButton`
- `SidebarWrapper` (`src/components/app/SidebarWrapper.tsx`, `'use client'`) renders the `<aside>` with `group/sidebar` and `data-collapsed` attribute; child components hide labels/sections via `group-data-[collapsed=true]/sidebar:hidden` Tailwind variants — no state passed into server components
- `isCollapsed` is persisted to `localStorage` key `sidebar-collapsed`; defaults to `false` on SSR, hydrated client-side in `useEffect`
- Mobile drawer closes automatically on route change via `usePathname` effect in `SidebarWrapper`
- All `itemCollections` inserts verify ownership of both the collection AND the item before writing

## Tags

- DB read helpers: `src/lib/tag-queries.ts` — `getUserTags`, `getTagsForItem`, `getTagsForItems`
- Tag mutations are handled inside `createItem` / `updateItem` in `src/actions/items.ts` — no separate actions file
- `TagSelector` component (`src/components/items/TagSelector.tsx`) — chip/pill input rendered inside `ItemForm` for all item types; uses hidden inputs (`name="tagName"`) + sentinel `hasTagSelector=1`; same pattern as `CollectionSelector`
- `updateItem` only syncs tags when `hasTagSelector=1` sentinel is present (mirrors collection sentinel)
- Tag names are normalized (trim + lowercase, max 50 chars, deduped) before upsert
- `tags` table has a unique constraint on `(user_id, name)`; upsert uses `.onConflictDoNothing()` then re-fetches IDs
- List pages use `getTagsForItems(itemIds[])` — one query per page — to build a `tagsMap` passed down to `ItemList` → `ItemRow`

## Favorites and Pins

- Toggle server actions: `src/actions/favorites.ts` — `toggleItemFavorite`, `toggleItemPin`, `toggleCollectionFavorite`; each fetches current value, flips it, and revalidates relevant paths
- `getItemsByType` sorts pinned items first: `orderBy(desc(items.isPinned), desc(items.createdAt))`
- `getFavoriteItems(userId)` returns all items where `isFavorite = true`, ordered by `desc(items.createdAt)`
- `FavoriteItemButton` / `PinItemButton` are client components in `src/components/items/`; rendered in `ItemRow` and item detail page
- `FavoriteCollectionButton` is a client component in `src/components/collections/`; rendered in `CollectionCard` and collection detail page
- `CollectionCard` is a `<div>` wrapper (not `<Link>`) so the favorite button can coexist alongside the link
- Favorites page: `src/app/(app)/favorites/page.tsx` — items only, reuses `ItemList` + `getTagsForItems`
- Sidebar "Favorites" link (`/favorites`) uses `Heart` icon from lucide-react, listed first in `navItems`

## Search

- Search page: `src/app/(app)/search/page.tsx` — server component; reads `q` and `type` from searchParams
- `searchItems(userId, query, typeId?)` in `src/lib/item-queries.ts` — uses `websearch_to_tsquery` for FTS (ILIKE fallback for ≤2 char queries), EXISTS subquery for tag matching, limited to 50 results
- GIN expression index on `items(to_tsvector(title || content || description))` created in migration 0003
- Header search is a native `<form action="/search">` — no JS needed, submits on Enter
- Type filter chips on `/search` link to `/search?q=...&type=<typeId>`; validated against `ITEM_TYPE_MAP` before use

## Shiki Syntax Highlighting

- `highlightCode(code, language?)` in `src/lib/shiki.ts` — async server-side utility; singleton `createHighlighter` cached at module level (one-dark-pro theme, all COMMON_LANGUAGES pre-loaded); falls back to `'text'` for empty or unrecognized language values
- Item detail page (`src/app/(app)/items/[id]/page.tsx`) uses `await highlightCode(item.content, item.language)` for `system_snippet`, `system_command`, `system_prompt`; output rendered via `dangerouslySetInnerHTML` in a `<div className="line-numbers ...">` wrapper
- Line numbers are CSS-only: `.line-numbers` sets `counter-reset: line`; `.line-numbers .line::before` uses `counter-increment` — defined in `src/app/globals.css`; Shiki wraps each line in `<span class="line">` automatically
- Note (`system_note`) type is excluded from Shiki — continues to render TipTap HTML via `dangerouslySetInnerHTML` with prose styling

## Editors

- `CodeMirrorEditor` (`src/components/items/CodeMirrorEditor.tsx`) — client component; used for snippet, command, prompt types; props: `value`, `language?`, `onChange`; uses `@codemirror/theme-one-dark`, `basicSetup`, and a `Compartment` to reconfigure the language extension live when `language` prop changes
- `TipTapEditor` (`src/components/items/TipTapEditor.tsx`) — client component; used for note type; props: `value`, `onChange`; uses `@tiptap/react` `StarterKit`; outputs HTML via `editor.getHTML()`; includes a toolbar with B/I/H1-H3/UL/OL/code/codeblock
- Both editors submit content via a `<input type="hidden" name="content" value={contentValue} />` in `ItemForm` — FormData picks it up automatically
- `ItemForm` routes to the correct editor via `CODE_TYPE_IDS` / `NOTE_TYPE_IDS` constants; `selectedLanguage` state drives the language dropdown and is passed to `CodeMirrorEditor`
- Note item detail page renders content with `dangerouslySetInnerHTML` + `prose prose-sm prose-invert` styling; all other types keep `<pre>` block
- `@tailwindcss/typography` is installed; registered via `@plugin "@tailwindcss/typography"` in `src/app/globals.css`
- Language packages installed: javascript/typescript (`@codemirror/lang-javascript`), css, html, json, python, rust, sql, markdown, cpp/c; unmapped languages fall back to plaintext

## Copy to Clipboard

- `CopyButton` (`src/components/items/CopyButton.tsx`) — client component; props: `content: string | null | undefined`, `className?`; uses `navigator.clipboard.writeText`; strips HTML via `DOMParser` when content contains `<` (for note type); shows `toast.success` / `toast.error` from `sonner`
- `<Toaster>` from `@/components/ui/sonner` is mounted in app layout (`position="bottom-right"`, `duration={2000}`)
- `toast` is imported directly from `sonner` in components
- `ItemRow` renders `CopyButton` with `opacity-0 group-hover:opacity-100 focus:opacity-100`; `<li>` has `group` class; file/image types pass `null` so button is not rendered
- Item detail page passes `copyContent` derived from type: URL type → `item.url`, content types → `item.content`, file/image → `null`

## Recently Used Items

- localStorage utility: `src/lib/recently-used.ts` — `pushRecentItem(id)` prepends + deduplicates + caps at 10; `getRecentItemIds()` reads safely (returns `[]` on SSR/error)
- `RecentlyUsedTracker` (`src/components/items/RecentlyUsedTracker.tsx`) — client component, renders null, calls `pushRecentItem` once on mount via `useRef` + `useEffect`; mounted on item detail page
- `fetchRecentItems(ids)` server action (`src/actions/recently-used.ts`) — resolves ID array to `{ items, tagsMap }` scoped by session userId; returns empty result if unauthenticated
- `getItemsByIds(userId, ids[])` in `src/lib/item-queries.ts` — bulk fetch with `inArray`, client-side sort preserves recency order
- `RecentlyUsedSection` (`src/components/dashboard/RecentlyUsedSection.tsx`) — client component on dashboard; reads localStorage + calls server action on mount; renders `ItemRow` list; hidden when empty or before hydration

## Soft Delete and Trash

- `items.deletedAt` and `collections.deletedAt` (nullable timestamp) — set on "delete"; null means active
- **Every** query helper in `item-queries.ts`, `collection-queries.ts`, `tag-queries.ts`, and inline dashboard queries must include `isNull(items.deletedAt)` / `isNull(collections.deletedAt)` — missing one silently surfaces deleted records
- `deleteItem` / `bulkDeleteItems` / `deleteCollection` in their respective action files soft-delete by setting `deletedAt = new Date()`; R2 file deletion is deferred to permanent delete
- Trash actions: `src/actions/trash.ts` — `restoreItem`, `restoreCollection`, `permanentDeleteItem`, `permanentDeleteCollection`, `emptyTrash`, `purgeExpiredTrash`
- `purgeExpiredTrash(userId)` is called at the top of the `/trash` page (server component) before fetching trash lists — lazy 30-day purge, no cron needed
- Trash UI components: `src/components/trash/` — `TrashItemRow`, `TrashCollectionRow`, `EmptyTrashButton` (all client components)
- `/trash` page: `src/app/(app)/trash/page.tsx`; Trash link in `SidebarNav.tsx` uses `Trash2` icon

**IMPORTANT:** Do not add Claude to any commit messages