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
- [ ] Write seed script for system types: snippet, prompt, note, command, file, image, link
- [ ] Assign correct colors and icons per spec
- [ ] Run seed and verify

### 4. Authentication (better-auth)
- [ ] Configure better-auth with email/password provider
- [ ] Set up Drizzle adapter for better-auth
- [ ] Build sign-up page
- [ ] Build sign-in page
- [ ] Build sign-out
- [ ] Protect app routes (redirect unauthenticated users)
- [ ] Verify session works across page navigations

### 5. Core Layout Shell
- [ ] Root layout with dark mode default
- [ ] Collapsible sidebar
  - [ ] Item type links (Snippets, Prompts, Notes, etc.)
  - [ ] Collections list (latest)
  - [ ] Collapse/expand toggle
- [ ] Main content area
- [ ] Mobile: sidebar becomes drawer
- [ ] Top bar / nav (if needed)

---

## Phase 2 — Core Features

### 6. Items CRUD
- [ ] Item list view (grid/list) filtered by type
- [ ] Quick-create item drawer (accessible from anywhere)
- [ ] Item detail drawer (view/edit)
- [ ] Create item (title, type, content)
- [ ] Edit item
- [ ] Delete item (with confirmation)
- [ ] Item type color-coded cards

### 7. Collections CRUD
- [ ] Collections grid on main view (color-coded by dominant item type)
- [ ] Create collection
- [ ] Edit collection (name, description)
- [ ] Delete collection (with confirmation)
- [ ] Add item to collection
- [ ] Remove item from collection
- [ ] View all collections an item belongs to

### 8. Tags
- [ ] Add tags to items (on create and edit)
- [ ] Remove tags from items
- [ ] Display tags on item cards

### 9. Item Type Filtering
- [ ] Sidebar type links filter main view
- [ ] URL reflects active filter (e.g. `/items/snippets`)
- [ ] Active state on sidebar links

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

### 13. Copy to Clipboard + Keyboard Shortcuts
- [ ] One-click copy button on all item cards and detail views
- [ ] Toast confirmation on copy
- [ ] Cmd+K command palette (search + quick actions)
- [ ] Cmd+N opens new item drawer

### 14. CodeMirror 6 + TipTap Editors
- [ ] Swap textarea for CodeMirror 6 on code-type items (snippet, command, prompt)
- [ ] CodeMirror language detection based on item `language` field
- [ ] Swap textarea for TipTap on note-type items
- [ ] TipTap markdown support (bold, italic, headings, code blocks, lists)

### 15. Shiki Syntax Highlighting
- [ ] Integrate Shiki for read/display view of code-type items
- [ ] Use a VS Code-compatible dark theme
- [ ] Language detection fallback for unknown types

---

## Phase 4 — Advanced

### 16. File Uploads (Cloudflare R2)
- [ ] Configure R2 bucket and credentials
- [ ] Upload API route with progress tracking
- [ ] File and image item creation flow
- [ ] Display uploaded files/images in item detail
- [ ] Delete file from R2 on item delete

### 17. AI Features (Anthropic Claude Haiku)
- [ ] Auto-tag suggestions on item create/edit
- [ ] AI summary for text items
- [ ] Explain This Code for snippet/command items
- [ ] Prompt optimizer for prompt items
- [ ] Loading states and error handling for all AI actions

### 18. Export
- [ ] Export all items as JSON
- [ ] Export all items as Markdown (one file per item or combined)
- [ ] Export single collection
- [ ] Download trigger from UI
