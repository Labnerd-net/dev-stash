# DevStash Roadmap

## Phase 1 — Foundation

Everything else depends on this phase being solid before moving on.

### 1. Dependencies & Configuration
- [x] Install Drizzle ORM + drizzle-kit
- [x] Install better-auth
- [x] Install and init ShadCN UI
- [x] Install CodeMirror 6
- [x] Install TipTap
- [x] Install Shiki
- [x] Configure `.env` (DB connection, better-auth secret, R2 credentials, Anthropic API key)
- [x] Verify Tailwind v4 + PostCSS config is correct

### 2. Database Schema + Migration
- [x] Define Drizzle schema: User, Item, ItemType, Collection, ItemCollection, Tag, ItemTag
- [x] Generate and run initial migration
- [x] Verify schema in local Postgres

### 3. Seed System Item Types
- [x] Write seed script for system types: snippet, prompt, note, command, file, image, link
- [x] Assign correct colors and icons per spec
- [x] Run seed and verify

### 4. Authentication (better-auth)
- [x] Configure better-auth with email/password provider
- [x] Set up Drizzle adapter for better-auth
- [x] Build sign-up page
- [x] Build sign-in page
- [x] Build sign-out
- [x] Protect app routes (redirect unauthenticated users)
- [x] Verify session works across page navigations

### 5. Core Layout Shell
- [x] Root layout with dark mode default
- [x] Fixed sidebar
  - [x] Item type links (Snippets, Prompts, Notes, Commands, Files, Images, Links)
- [x] Main content area
- [x] Top bar with search, New Item/Collection buttons, user + sign-out
- [x] Dashboard with stats cards (Your Items, Collections, Favorites)

---

## Phase 2 — Core Features

### 6. Items CRUD
- [x] Item list view filtered by type
- [x] Item detail page (view)
- [x] Create item (title, type, content, url, description, language)
- [x] Edit item
- [x] Delete item (with confirmation)
- [x] Item type color-coded indicators
- Note: creation/edit uses dedicated pages (/items/new, /items/[id]/edit) rather than a drawer

### 7. Collections CRUD
- [x] Collections grid on main view (color-coded by dominant item type)
- [x] Create collection
- [x] Edit collection (name, description)
- [x] Delete collection (with confirmation)
- [x] Add item to collection
- [x] Remove item from collection
- [x] View all collections an item belongs to
- [x] Show latest collections list in sidebar

### 8. Tags
- [x] Add tags to items (on create and edit)
- [x] Remove tags from items
- [x] Display tags on item cards

### 9. Item Type Filtering
- [x] Sidebar type links filter main view
- [x] URL reflects active filter (e.g. `/snippets`)
- [x] Active state on sidebar links

---

## Phase 3 — Usability

### 10. Search
- [x] Postgres full-text search index (`to_tsvector`) on title, content, tags
- [x] Search input in top bar
- [x] Search results page
- [x] Filter results by type

### 11. Favorites + Pins
- [x] Toggle favorite on items and collections
- [x] Toggle pin on items
- [x] Pinned items surface at top of list views
- [x] Favorites filter/view

### 12. Recently Used
- [x] Track last-accessed item IDs in localStorage on open
- [x] "Recently used" section on dashboard/home view
- [x] Cap at last 10 items
- [x] Migrated to DB-backed `user_recently_viewed` table for cross-device history
- [x] `/recently-used` page showing full history (up to 50 items)

### 13. Sidebar Enhancements
- [x] Collapse/expand toggle
- [x] Mobile: sidebar becomes drawer

### 14. Copy to Clipboard
- [x] One-click copy button on all item cards and detail views
- [x] Toast confirmation on copy

### 15. CodeMirror 6 + TipTap Editors
- [x] Swap textarea for CodeMirror 6 on code-type items (snippet, command, prompt)
- [x] CodeMirror language detection based on item `language` field
- [x] Swap textarea for TipTap on note-type items
- [x] TipTap markdown support (bold, italic, headings, code blocks, lists)

### 16. Shiki Syntax Highlighting
- [x] Integrate Shiki for read/display view of code-type items
- [x] Use a VS Code-compatible dark theme
- [x] Language detection fallback for unknown types

---

## Phase 4 — Advanced

### 17. File Uploads (Cloudflare R2)
- [x] Configure R2 bucket and credentials
- [x] Upload API route with progress tracking
- [x] File and image item creation flow
- [x] Display uploaded files/images in item detail
- [x] Delete file from R2 on item delete

### 18. AI Features (Anthropic Claude Haiku)
- [x] Auto-tag suggestions on item create/edit
- [x] AI summary for text items
- [x] Explain This Code for snippet/command items
- [x] Prompt optimizer for prompt items
- [x] Loading states and error handling for all AI actions

### 20. Export
- [x] Export all items as JSON
- [x] Export all items as Markdown (one file per item or combined)
- [x] Export single collection
- [x] Download trigger from UI

### 21. Keyboard Shortcuts
- [ ] Cmd+K command palette (search + quick actions)
- [x] Cmd+N navigates to /items/new from anywhere (no drawer — uses dedicated page)
- [x] Cmd+Shift+C navigates to /collections/new from anywhere
- [x] Item row shortcuts: f = favorite, p = pin, c = copy (fires when row is focused via Tab)

### 22. Soft Delete and Trash
- [x] `deletedAt` column on items and collections (migration 0005)
- [x] All delete actions soft-delete instead of hard-deleting
- [x] All query helpers filter out soft-deleted records
- [x] `/trash` page listing trashed items and collections
- [x] Restore individual items and collections from trash
- [x] Permanent delete from trash (R2 file cleanup for file/image items)
- [x] Empty Trash button (clears all trashed records + R2 objects)
- [x] Lazy 30-day purge on `/trash` page load (no cron required)
- [x] Trash link in sidebar

### 23. Recently Used DB History
- [x] Replaced localStorage with `user_recently_viewed` DB table (migration 0006)
- [x] Upsert-on-view in item detail server component (fire-and-forget)
- [x] Dashboard section server-rendered (no hydration flicker)
- [x] `/recently-used` history page (up to 50 items) with "Recent" sidebar link
