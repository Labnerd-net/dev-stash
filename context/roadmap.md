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
- [ ] Quick-create item drawer (accessible from anywhere)
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
- [ ] Add tags to items (on create and edit)
- [ ] Remove tags from items
- [ ] Display tags on item cards

### 9. Item Type Filtering
- [x] Sidebar type links filter main view
- [x] URL reflects active filter (e.g. `/snippets`)
- [x] Active state on sidebar links

---

## Phase 3 — Usability

### 10. Search
- [ ] Postgres full-text search index (`to_tsvector`) on title, content, tags
- [ ] Search input in top bar
- [ ] Search results page / live results dropdown
- [ ] Filter results by type

### 11. Favorites + Pins
- [ ] Toggle favorite on items and collections
- [ ] Toggle pin on items
- [ ] Pinned items surface at top of list views
- [ ] Favorites filter/view

### 12. Recently Used (localStorage)
- [ ] Track last-accessed item IDs in localStorage on open
- [ ] "Recently used" section on dashboard/home view
- [ ] Cap at last 10 items

### 13. Sidebar Enhancements
- [ ] Collapse/expand toggle
- [ ] Mobile: sidebar becomes drawer

### 14. Copy to Clipboard + Keyboard Shortcuts
- [ ] One-click copy button on all item cards and detail views
- [ ] Toast confirmation on copy
- [ ] Cmd+K command palette (search + quick actions)
- [ ] Cmd+N opens new item drawer

### 15. CodeMirror 6 + TipTap Editors
- [ ] Swap textarea for CodeMirror 6 on code-type items (snippet, command, prompt)
- [ ] CodeMirror language detection based on item `language` field
- [ ] Swap textarea for TipTap on note-type items
- [ ] TipTap markdown support (bold, italic, headings, code blocks, lists)

### 16. Shiki Syntax Highlighting
- [ ] Integrate Shiki for read/display view of code-type items
- [ ] Use a VS Code-compatible dark theme
- [ ] Language detection fallback for unknown types

---

## Phase 4 — Advanced

### 17. File Uploads (Cloudflare R2)
- [ ] Configure R2 bucket and credentials
- [ ] Upload API route with progress tracking
- [ ] File and image item creation flow
- [ ] Display uploaded files/images in item detail
- [ ] Delete file from R2 on item delete

### 18. AI Features (Anthropic Claude Haiku)
- [ ] Auto-tag suggestions on item create/edit
- [ ] AI summary for text items
- [ ] Explain This Code for snippet/command items
- [ ] Prompt optimizer for prompt items
- [ ] Loading states and error handling for all AI actions

### 19. Export
- [ ] Export all items as JSON
- [ ] Export all items as Markdown (one file per item or combined)
- [ ] Export single collection
- [ ] Download trigger from UI
