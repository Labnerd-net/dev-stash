# Plan: Sidebar Enhancements

Spec file: context/specs/sidebar-enhancements.md
Branch: claude/feature/sidebar-enhancements

## Overview

The core challenge is that `Sidebar.tsx` is an async server component (fetches collections), but collapse/mobile-drawer state is client-side. The solution is:

1. A client-side `SidebarContext` hoisted above the layout so both `SidebarWrapper` (the visual sidebar shell) and `Header` (hamburger button) can share state.
2. A `data-collapsed` attribute on the `<aside>` element combined with Tailwind `group-data-*` CSS variants to drive visual changes inside server-rendered sidebar content — no need to pass state into server components.

## Files to Create

### `src/components/app/SidebarContext.tsx` (new, client)
- React context with: `isCollapsed`, `isMobileOpen`, `toggleCollapsed`, `openMobile`, `closeMobile`
- `SidebarProvider` component:
  - Starts with `isCollapsed = false` (SSR-safe default)
  - `useEffect` on mount reads `localStorage.getItem('sidebar-collapsed')` and syncs state
  - Writes to localStorage on every `toggleCollapsed` call
- Exports `useSidebar` hook

### `src/components/app/SidebarWrapper.tsx` (new, client)
- Consumes `useSidebar`
- Renders the `<aside>` element with dynamic classes:
  - Desktop expanded: `w-[220px]`
  - Desktop collapsed: `w-[52px]`
  - Width transitions via `transition-[width] duration-200`
  - Mobile: `fixed inset-y-0 left-0 z-40 -translate-x-full md:relative md:translate-x-0` — toggled open with `translate-x-0` when `isMobileOpen` is true
- Sets `data-collapsed={isCollapsed}` and `className="group/sidebar"` on the `<aside>` for CSS-driven child hiding
- Renders a **collapse toggle button** (ChevronLeft/ChevronRight) visible on `md+`, aligned to sidebar edge
- Renders a **mobile backdrop**: semi-transparent fixed overlay, `md:hidden`, visible when `isMobileOpen`; clicking it calls `closeMobile()`
- Uses `usePathname()` in a `useEffect` to call `closeMobile()` on route change
- Accepts `children` (server-rendered sidebar inner content)

## Files to Modify

### `src/components/app/Sidebar.tsx` (async server)
- Replace `<aside ...>` wrapper with `<SidebarWrapper>`
- Brand/logo link text (`DevStash`) wrapped in `<span className="group-data-[collapsed=true]/sidebar:hidden">`
- "Navigation" section label: add `group-data-[collapsed=true]/sidebar:hidden`
- Add an X close button (mobile only, `md:hidden`) inside the header row that calls `closeMobile()` — **problem**: this requires client state. Solution: render a small dedicated `SidebarCloseButton` client component inside `Sidebar.tsx` (RSC can compose client components).
- Collections section `<div>`: add `group-data-[collapsed=true]/sidebar:hidden` — collections have no icons so they disappear in icon-rail mode

### `src/components/app/SidebarNav.tsx` (client)
- Each nav `<Link>` gets `title={label}` for native tooltip when collapsed
- Label text wrapped in `<span className="group-data-[collapsed=true]/sidebar:hidden ml-0">`
- Icon stays visible always (`shrink-0` already set)
- Link `gap-2.5` → `gap-0 group-data-[collapsed=true]/sidebar:justify-center` so icon centers when label hides

### `src/components/app/Header.tsx` (client)
- Import `useSidebar`
- Add `<button>` with `<Menu>` icon at the very start of the header, `md:hidden`
- On click: calls `openMobile()`

### `src/app/(app)/layout.tsx` (server)
- Import `SidebarProvider` (client component — safe to import in server file)
- Wrap the entire `<div className="flex h-screen ...">` in `<SidebarProvider>`

## New Small Client Components

### `src/components/app/SidebarCloseButton.tsx` (new, client)
- Tiny `"use client"` component: an X icon button, `md:hidden`
- Consumes `useSidebar` to call `closeMobile()`
- Rendered inside `Sidebar.tsx` header row alongside the brand link

## Sequence

1. Create `SidebarContext.tsx`
2. Create `SidebarCloseButton.tsx`
3. Create `SidebarWrapper.tsx`
4. Modify `Sidebar.tsx`
5. Modify `SidebarNav.tsx`
6. Modify `Header.tsx`
7. Modify `layout.tsx`

## Notes

- No database changes. No new dependencies.
- localStorage key: `'sidebar-collapsed'`, value `'true'` or omitted.
- The SSR flash is acceptable: sidebar renders expanded on first paint, then collapses client-side if localStorage says so. This is the standard Next.js App Router pattern.
- No animation style requested, so `transition-[width] duration-200 ease-in-out` is a light default that can be removed if unwanted.
