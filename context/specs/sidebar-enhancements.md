# Spec for Sidebar Enhancements

Title: Sidebar Enhancements
Branch: claude/feature/sidebar-enhancements
Spec file: context/specs/sidebar-enhancements.md

## Summary

Add two usability improvements to the app sidebar: a collapse/expand toggle so users can reclaim horizontal space on desktop, and a responsive mobile drawer so the sidebar is accessible on small screens without taking up permanent space.

## Functional Requirements

- **Collapse toggle (desktop)**
  - A toggle button (e.g. chevron or panel icon) is visible on the sidebar at all times on desktop
  - Clicking it collapses the sidebar to an icon-only rail (shows item type icons, no labels) or hides it entirely — the simpler icon-rail approach is preferred
  - Clicking again expands back to full width
  - Collapsed state is persisted in localStorage so it survives page navigations and refreshes
  - The main content area expands to fill the freed space when the sidebar is collapsed

- **Mobile drawer**
  - On small screens (below a breakpoint, e.g. `md`), the sidebar is hidden by default and does not occupy layout space
  - A hamburger/menu button in the header opens the sidebar as an overlay drawer from the left
  - The drawer can be closed via an X button inside the drawer, by tapping the backdrop, or by navigating to a new page
  - No permanent sidebar space is consumed on mobile

## Possible Edge Cases

- Collapsed state stored in localStorage must not break SSR — the initial render should default to expanded and hydrate the persisted state client-side to avoid layout shift
- Sidebar has async data fetching (collections list); drawer/collapse transitions should not re-trigger fetches unnecessarily
- Active nav link highlighting still works correctly in both collapsed and drawer modes
- Very long collection names in the sidebar need truncation in both expanded and icon-only states
- The mobile drawer should trap focus while open for accessibility
- Deep linking (navigating directly to a page on mobile) should open with the drawer closed

## Acceptance Criteria

- [ ] Desktop: sidebar has a visible toggle button that collapses it to an icon rail or hides it
- [ ] Desktop: collapsed state is saved to localStorage and restored on next load
- [ ] Desktop: main content area fills the full width when sidebar is collapsed
- [ ] Mobile (below `md`): sidebar is not visible by default; a menu button in the header opens it as a drawer
- [ ] Mobile drawer: closes on backdrop click, X button, and page navigation
- [ ] All existing sidebar nav links and collections list work in all states
- [ ] No flash of wrong sidebar state on initial page load (SSR-safe hydration)

## Open Questions

- Should the icon-rail show tooltips on hover for the collapsed item type icons? - sure
- Should the hamburger button on mobile replace the existing header layout or be added alongside it? - Maybe alongside if there is room
- Is there a preferred animation style (slide, fade, none)? - no preference

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- localStorage read/write for collapsed state persists and restores correctly
- Sidebar renders in expanded state by default on first visit (no localStorage entry)
- Toggling collapsed state updates localStorage

## Personal Opinion

This is a straightforward and high-value usability improvement. The mobile drawer is nearly essential — the current layout almost certainly breaks on mobile since the sidebar takes up permanent space. The desktop collapse is a nice-to-have for power users who want more screen space.

One concern: the existing `Sidebar.tsx` is an async server component (fetches collections). The collapse toggle and mobile drawer require client-side state, which means a client wrapper component will be needed around the server component, or the architecture will need a small adjustment. This is manageable but worth planning carefully to avoid prop-drilling the open state through server components.

Overall complexity is low-to-medium. No new data model changes required.
