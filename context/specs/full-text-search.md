# Spec for Full-Text Search

Title: Full-Text Search
Branch: claude/feature/full-text-search
Spec file: context/specs/full-text-search.md

## Summary

Implement Postgres full-text search across items (title, content, description) and their associated tags. Wire up the existing decorative search input in the header to navigate to a dedicated search results page. Results are filterable by item type.

## Functional Requirements

- Add a GIN expression index on `items` using `to_tsvector('english', ...)` over `title`, `content`, and `description` fields
- Add a `searchItems(userId, query, typeId?)` query helper that uses `websearch_to_tsquery` for FTS and also matches items whose tags contain the query string (ILIKE)
- Search results page at `/search?q=...` — server component, shows matching items grouped or listed with their type indicator and tags
- Type filter chips on the results page (All + each system type) — selecting a type appends `?type=system_snippet` etc. to the URL
- Header search input navigates to `/search?q=<value>` on Enter or form submit; shows active/focused state when on the `/search` route
- Empty query (`/search` with no `q`) shows a prompt to start searching rather than rendering all items
- No results state: a clear message when the query returns zero hits

## Possible Edge Cases

- Very short queries (1–2 chars) where `websearch_to_tsquery` may return nothing — fall back to ILIKE on title for those cases
- SQL injection via the query string — `websearch_to_tsquery` is parameterized so this is safe; ILIKE also uses a bound parameter
- `websearch_to_tsquery` throws on malformed input (e.g. bare `AND`/`OR`) — wrap in a try/catch and fall back gracefully or sanitize before passing
- Items with no content, description, or tags — the index uses `coalesce(..., '')` so they are still indexed by title
- `typeId` filter param is an arbitrary string — validate it against the known system type IDs before using it in the query
- Large result sets — limit results (e.g. 50) and note pagination is out of scope for this phase

## Acceptance Criteria

- Typing a term into the header search and pressing Enter navigates to `/search?q=<term>`
- Results page shows items whose title, content, description, or tags match the query
- Each result row shows the item title, preview, tags, and type color indicator (reuse `ItemRow`)
- Type filter chips appear above results; clicking one re-queries with `?type=<typeId>`
- "All" chip is selected when no type filter is active; the matching type chip is highlighted when a filter is active
- Searching for a tag name returns items with that tag
- Empty query state: instructional message, no items listed
- Zero results state: "No items found for …" message
- Build passes with no TypeScript errors

## Open Questions

- Should the search page also be reachable from the sidebar or only from the header input? - no only from the header input
- Should tag matching be exact (whole tag name) or substring? Substring (ILIKE `%q%`) is proposed here for usability. - substring
- Pagination out of scope — confirm a hard limit of 50 results is acceptable for now. - no pagination yet

## Testing Guidelines

No test runner is configured. Verify manually in the browser:
- Search for a known item title
- Search for a tag name
- Search for content that appears only in the body of an item
- Apply a type filter and confirm only items of that type appear
- Submit an empty query and confirm no results are listed
- Test with a query that returns no results

## Personal Opinion

This is a straightforward, high-value feature — the search input has been sitting as a placeholder since the shell was built and users would hit it immediately. The Postgres FTS approach is the right call given the existing stack; no external search service needed at this scale.

The one thing worth flagging: the roadmap also mentions a "live results dropdown." I'd recommend skipping the dropdown for now and shipping the results page first. The dropdown adds meaningful complexity (debounce, positioning, keyboard navigation, loading states) for marginal benefit when the results page is already navigable. It can be a follow-up item.
