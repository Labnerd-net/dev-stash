# Current Feature

## Current Feature Spec File

Title:
Spec file:
Branch:

## Current Feature Plan File

Plan file:

## History

<!-- Keep this updated. Earliest to latest -->
- Database Schema + Migration: defined Drizzle schema, generated and applied migration, seeded system item types
- Authentication: configured better-auth with Drizzle adapter, email/password sign-up/sign-in/sign-out, route protection via proxy.ts, ALLOWED_EMAILS allowlist
- App Shell and Dashboard: (app) route group with session guard layout, collapsible sidebar with item type nav + collections, header with search/actions/user area, dashboard stats cards, stub pages for all item types
- Docker Deployment: multi-stage Dockerfile with standalone output, entrypoint.sh runs drizzle migrations on startup, deployed to Dokploy with external Postgres; requires BETTER_AUTH_URL, BETTER_AUTH_SECRET, DATABASE_URL env vars
- DbGate Deployment: deployed DbGate (dbgate/dbgate:latest) to Dokploy under a new "Tools" project, configured at https://dbgate.labnerd.net with Let's Encrypt SSL and LOGIN/PASSWORD authentication
- Items CRUD: server actions (createItem, updateItem, deleteItem) with Zod validation and atomic ownership checks; item type map with hardcoded system type IDs; getItemsByType/getItemById query helpers; ItemForm, ItemList, ItemRow, ItemTypeSelector, DeleteItemButton components; /items/new, /items/[id], /items/[id]/edit pages; all 7 type list pages populated with real data and empty states; dashboard stats updated to real counts; Header "New Item" button wired to /items/new
- Collections CRUD: createCollection/updateCollection/deleteCollection/removeItemFromCollection server actions with Zod validation, ownership checks on both collection and item IDs, and atomic transaction for membership replace; collection-queries.ts with 7 query helpers including two-query dominant-color approach; CollectionForm with item checklist (hidden-input pattern), CollectionCard (color-accented), CollectionGrid; /collections, /collections/new, /collections/[id], /collections/[id]/edit pages; CollectionSelector in ItemForm for item→collection assignment during create/edit; item detail page shows collection badges; Sidebar split into async server component + SidebarNav client component showing latest 10 collections; Header "New Collection" button wired to /collections/new
- Item Tags: tag-queries.ts with getUserTags/getTagsForItem/getTagsForItems helpers; TagSelector chip/pill client component with autocomplete, Enter/comma to add, backspace to remove, hidden-input pattern; createItem/updateItem extended to upsert tags (bulk insert + onConflictDoNothing) and atomically replace itemTags on edit via hasTagSelector sentinel; unique constraint added to tags(userId, name) with migration 0002; tags display as badges on ItemRow in all 7 type list pages (single getTagsForItems query per page) and on item detail page; ItemForm renders TagSelector for all item types
- Full-Text Search: GIN expression index on items (title + content + description) via migration 0003; searchItems query helper in item-queries.ts using websearch_to_tsquery (ILIKE fallback for ≤2 char queries) with EXISTS subquery for tag matching, user-scoped, 50-item limit; /search page with type filter chips, result count, empty state, no-results state; header search input wired via native HTML form (action="/search", name="q")
- Favorites and Pins: toggleItemFavorite/toggleItemPin/toggleCollectionFavorite server actions in actions/favorites.ts with ownership checks; getFavoriteItems query added to item-queries.ts; getItemsByType now sorts pinned items first (desc isPinned, desc createdAt); FavoriteItemButton/PinItemButton client components on item rows and item detail page; FavoriteCollectionButton on collection cards and collection detail page; /favorites page shows all favorited items; "Favorites" sidebar nav link added
- CodeMirror 6 + TipTap Editors: CodeMirrorEditor client component with oneDark theme, language compartment for live switching, and updateListener for FormData-compatible hidden input submission; TipTapEditor client component with StarterKit and minimal toolbar (B/I/H1-H3/UL/OL/code/codeblock); ItemForm updated to route snippet/command/prompt to CodeMirrorEditor, note to TipTapEditor, and keep textarea for any future custom types; selectedLanguage state makes language dropdown change update CodeMirror live; item detail page renders note content as HTML via dangerouslySetInnerHTML with prose styling; @tailwindcss/typography installed and registered via @plugin in globals.css
- Shiki Syntax Highlighting: src/lib/shiki.ts with singleton createHighlighter (one-dark-pro theme, all COMMON_LANGUAGES pre-loaded) and highlightCode helper with 'text' fallback for unknown/empty languages; item detail page renders snippet/command/prompt content via Shiki HTML in a .line-numbers wrapper div; note type unchanged (prose HTML); line numbers via CSS counters on Shiki's .line spans added to globals.css — server-side only, zero client JS
