# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
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

## Auth

- Auth is handled by **better-auth** (`src/lib/auth.ts`) with the Drizzle adapter (`usePlural: true`)
- Client-side auth via `src/lib/auth-client.ts` — import `authClient` in client components
- Server-side session via `auth.api.getSession({ headers: await headers() })` in server components
- Route protection is in `src/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`)
- Sign-up is restricted by `ALLOWED_EMAILS` env var (comma-separated); empty = open to all

## Items

- Server actions for mutations: `src/actions/items.ts` — `createItem`, `updateItem`, `deleteItem`
- DB read helpers: `src/lib/item-queries.ts` — `getItemsByType`, `getItemById`
- Item type map (slug → seeded typeId): `src/lib/item-type-map.ts` — also exports `TYPE_FIELD_CONFIG` (which fields each type shows) and `TYPE_ID_TO_SLUG` (for revalidation)
- Seeded system type IDs are deterministic: `system_snippet`, `system_prompt`, `system_note`, `system_command`, `system_file`, `system_image`, `system_url`
- Item components: `src/components/items/` — `ItemForm`, `ItemList`, `ItemRow`, `ItemTypeSelector`, `DeleteItemButton`, `DeleteItemRedirect`
- `Button` uses `@base-ui/react/button` — no `asChild` prop; use `buttonVariants` from `@/components/ui/button` on `<Link>` elements instead
- Item pages: `/items/new`, `/items/[id]`, `/items/[id]/edit` — `params` is a `Promise<{ id: string }>` in Next.js 16, must `await params`

**IMPORTANT:** Do not add Claude to any commit messages