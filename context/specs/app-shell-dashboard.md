# Spec for App Shell and Dashboard

Title: App Shell and Dashboard
Branch: claude/feature/app-shell-dashboard
Spec file: context/specs/app-shell-dashboard.md

## Summary

Build the core application shell — the persistent layout that wraps all authenticated pages — and the dashboard home view. The design should closely emulate the reference UI at devstash.io/dashboard: a dark, minimal, developer-friendly interface with a collapsible left sidebar, a top header bar, and a main content area.

This is a UI-only feature. No data fetching or CRUD logic yet — use zero/placeholder counts where stats would appear. The goal is to establish the visual structure and component hierarchy that all future features will build on.

## Functional Requirements

### Layout Shell (`src/app/(app)/layout.tsx`)
- Wrap all authenticated routes in a shared layout with sidebar + header
- Sidebar and header should be persistent across all app routes
- The current `src/app/page.tsx` becomes the dashboard within this shell

### Left Sidebar
- Fixed width (~220px), full viewport height, dark background
- DevStash logo/wordmark at the top
- **Navigation** section with links for each item type:
  - Snippets
  - Prompts
  - Notes
  - Commands
  - Files
  - Images
  - Links
- Each nav item shows an icon and label; active state clearly highlighted
- **Collections** section below navigation with a "View all collections" link
- User name and email at the bottom of the sidebar

### Top Header Bar
- Full width, sits above the main content area
- Search input in the center ("Search items..." placeholder) with keyboard shortcut hint (Cmd+K / Ctrl+K)
- Right side: "New Collection" button and "New Item" button (primary action)
- No "Upgrade" button needed (self-hosted, no plans)

### Dashboard Page (`src/app/(app)/page.tsx` or `src/app/page.tsx`)
- Heading: "Dashboard" with subtitle "Your developer knowledge hub"
- **Stats row**: four cards showing:
  - Your Items
  - Collections
  - Favorite Items
  - Favorite Collections
  - Each card shows 0 (static placeholder), an icon, and a label
  - Cards use distinct accent colors matching the reference (purple, teal/blue, orange/red, purple variant)
- **Collections section**: heading "Collections" with "View all" link; empty state "No collections yet"

### Routing
- Group authenticated routes under `src/app/(app)/` route group
- The existing `src/app/page.tsx` auth check and session logic moves into this group's layout
- Individual item type pages are stubbed as empty pages for now (e.g. `/snippets`, `/prompts`, etc.) so the nav links resolve

## Possible Edge Cases

- Sidebar nav active state must correctly highlight the current route without false positives (e.g. `/notes` should not also highlight `/`)
- User info at the bottom of the sidebar should gracefully handle missing name (show email fallback)
- The sign-out action must still work from within the new layout
- Route group `(app)` must not break the existing `/sign-in` and `/sign-up` routes

## Acceptance Criteria

- [ ] Authenticated users land on the dashboard and see the full shell (sidebar + header + dashboard content)
- [ ] Unauthenticated users are still redirected to `/sign-in`
- [ ] All sidebar nav item links render without 404 errors
- [ ] Sidebar shows the logged-in user's name and email
- [ ] Stats cards render with 0 values and correct icons/colors
- [ ] "New Item" and "New Collection" buttons are visible (no functionality yet)
- [ ] Search bar is visible with placeholder text (no functionality yet)
- [ ] `npm run build` passes with no errors

## Open Questions

- Should the sidebar be collapsible on initial implementation, or start fixed and add collapse later? (Recommendation: start fixed, add collapse in a later feature) - fixed for now
- Does the sign-out button move to the sidebar bottom (near user info) or stay separate? - I'd rather the user info/profile/settings/logout be at the top right somewhere instead of the bottom left.  It can all be in one menu when we get to that point.

## Testing Guidelines

No automated tests for this feature. Visual verification in the browser is sufficient.

## Personal Opinion

This is the right next step — you need a solid shell before any CRUD features are worth building. The reference UI is clean and appropriate for the audience.

One concern: avoid over-engineering the sidebar nav now. Each item type page doesn't need real content yet; stubs are fine. The temptation to wire up data or add animations will slow this down — keep it structural.

Starting with a fixed-width sidebar (no collapse) is the right call for MVP. Collapse adds state complexity and CSS work that isn't needed yet.
