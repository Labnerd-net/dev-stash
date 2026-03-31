# Plan: App Shell and Dashboard

## Context

The app currently has no application shell — after sign-in, users land on a bare placeholder page. This plan builds the persistent layout (sidebar + header) and the dashboard home view, styled after devstash.io, establishing the visual structure all future features will build on.

## Current State

- `src/app/page.tsx` — bare placeholder, does session check + redirect, renders welcome text
- `src/app/layout.tsx` — root layout: Geist fonts, dark class, no app chrome
- Only one shadcn component: `src/components/ui/button.tsx` (Base UI backed)
- `lucide-react` is installed but unused
- No route groups yet

## Route Group Restructure

Create an `(app)` route group that wraps all authenticated routes:

```
src/app/
├── (app)/
│   ├── layout.tsx          ← NEW: session guard + shell (sidebar + header)
│   ├── page.tsx            ← MOVED from src/app/page.tsx (dashboard content only)
│   ├── snippets/page.tsx   ← NEW: stub
│   ├── prompts/page.tsx    ← NEW: stub
│   ├── notes/page.tsx      ← NEW: stub
│   ├── commands/page.tsx   ← NEW: stub
│   ├── files/page.tsx      ← NEW: stub
│   ├── images/page.tsx     ← NEW: stub
│   └── links/page.tsx      ← NEW: stub
├── sign-in/page.tsx        ← unchanged
├── sign-up/page.tsx        ← unchanged
├── api/auth/[...all]/      ← unchanged
├── layout.tsx              ← unchanged (root: fonts + dark class)
└── globals.css             ← unchanged
```

## New Components

```
src/components/app/
├── Sidebar.tsx     ← nav links per item type + collections section
└── Header.tsx      ← search bar + action buttons + user area (top-right)
```

## Implementation Steps

### Step 1 — `src/app/(app)/layout.tsx`

Server component. Checks session (same pattern as current `page.tsx`), redirects to `/sign-in` if unauthenticated. Renders:

```
<div class="flex h-screen overflow-hidden">
  <Sidebar />
  <div class="flex flex-col flex-1 overflow-hidden">
    <Header user={session.user} />
    <main class="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

Passes `session.user` (name + email) as prop to `Header`.

### Step 2 — `src/app/(app)/page.tsx` (Dashboard)

Server component. No session check (layout handles it). Renders:
- Heading "Dashboard" + subtitle "Your developer knowledge hub"
- Stats row: 4 cards (static 0 values)
  - Your Items — `Package` icon, blue accent
  - Collections — `FolderOpen` icon, teal accent
  - Favorite Items — `Star` icon, amber accent
  - Favorite Collections — `Bookmark` icon, purple accent
- Collections section with "View all" link + "No collections yet" empty state

### Step 3 — `src/components/app/Sidebar.tsx`

Client component (needs `usePathname` for active state). Fixed width ~220px. Sections:

**Top**: DevStash wordmark/logo

**Navigation** section label + links:
| Label | Icon (lucide) | href |
|-------|--------------|------|
| Snippets | `Code2` | /snippets |
| Prompts | `Sparkles` | /prompts |
| Notes | `FileText` | /notes |
| Commands | `Terminal` | /commands |
| Files | `File` | /files |
| Images | `Image` | /images |
| Links | `Link` | /links |

Active state: compare `usePathname()` to href (exact match for `/`, startsWith for others).

**Collections** section label + "View all collections" link → `/collections` (stub).

### Step 4 — `src/components/app/Header.tsx`

Client component. Three zones:
- **Left**: empty / page title (can expand later)
- **Center**: search input, placeholder "Search items…", Ctrl+K hint badge (no functionality yet)
- **Right**: `New Collection` button (ghost variant) + `New Item` button (default variant) + user area

**User area** (top-right): shows `session.user.name` and a sign-out trigger. Keep it simple — render the user name as text and a ghost `Sign Out` button inline. (Full dropdown menu deferred to later feature as per spec.)

Receives `user` prop (name + email) from layout.

### Step 5 — Delete `src/app/page.tsx`

The old root `page.tsx` is replaced by `(app)/page.tsx`. The old file must be deleted so Next.js doesn't conflict.

### Step 6 — Stub pages

Each stub: minimal server component, returns a `<div>` with a heading. Example for snippets:

```tsx
export default function SnippetsPage() {
  return <div><h1>Snippets</h1></div>
}
```

Same pattern for: prompts, notes, commands, files, images, links.

## Files to Create/Modify

| Action | Path |
|--------|------|
| CREATE | `src/app/(app)/layout.tsx` |
| MOVE/REPLACE | `src/app/(app)/page.tsx` (new dashboard content) |
| DELETE | `src/app/page.tsx` |
| CREATE | `src/components/app/Sidebar.tsx` |
| CREATE | `src/components/app/Header.tsx` |
| CREATE | `src/app/(app)/snippets/page.tsx` |
| CREATE | `src/app/(app)/prompts/page.tsx` |
| CREATE | `src/app/(app)/notes/page.tsx` |
| CREATE | `src/app/(app)/commands/page.tsx` |
| CREATE | `src/app/(app)/files/page.tsx` |
| CREATE | `src/app/(app)/images/page.tsx` |
| CREATE | `src/app/(app)/links/page.tsx` |

## Reused Patterns

- Session check pattern: `auth.api.getSession({ headers: await headers() })` — from current `src/app/page.tsx`
- `authClient.signOut()` with redirect — from `src/components/auth/SignOutButton.tsx`
- `cn()` utility — `src/lib/utils.ts`
- Button component — `src/components/ui/button.tsx`

## Verification

1. `npm run build` — must pass with no errors
2. Navigate to `/` while signed out → redirects to `/sign-in`
3. Sign in → lands on dashboard with sidebar + header visible
4. Click each sidebar nav link → no 404 errors
5. Dashboard shows 4 stats cards (all zeros) and empty collections state
6. User name visible top-right; sign-out button works and redirects to `/sign-in`
