## DevStash Project Specifications

## Problem (Core Idea)

Developers keep their essentials scattered:

- Code snippets in VS Code or Notion
- AI prompts in chats
- Context files buried in projects
- Useful links in bookmarks
- Docs in random folders
- Commands in .txt files
- Project templates in GitHub gists
- Terminal commands in bash history

This creates context switching, lost knowledge, and inconsistent workflows. DevStash provides ONE fast, searchable, AI-enhanced hub for all dev knowledge & resources.

## Users

- **Everyday Developer**:
  Needs a fast way to grab snippets, prompts, commands, links.

- **AI-first Developer**:
  Saves prompts, contexts, workflows, system messages.

- **Content Creator / Educator**:
  Stores code blocks, explanations, course notes.

- **Full-stack Builder**:
  Collects patterns, boilerplates, API examples.

## Features
Here is a list of features for DevStash.

A. **Items/Item Types**
Items can have types. Users will be able to create custom types, but we will start with the following system types that can not be changed:

- snippet
- prompt
- note
- command
- file
- image
- link

A type can be text (snippet, note, etc), url (link) or a file (file, image) URLs should look like - `/items/snippets`.

Items should be quick to access and create within a drawer.

B. **Collections**

Users can create collections that can have items of any type. An item can belong to multiple collections (e.g., a React snippet could be in both "React Patterns" and "Interview Prep").

Some examples may be:

- React Patterns (snippets, notes)
- Context Files (files)
- Python Snippets (snippets)

C. **Search**

Full-text search using Postgres `to_tsvector` across:

- Content
- Tags
- Titles
- Types

D. **Authentication**

- Email/password sign-in.

E. **Other Features**

- Collection and item favorites
- Items pin to top
- Recently used (tracked in localStorage, not DB)
- Import code from a file
- CodeMirror 6 editor for code types (snippets, commands, prompts)
- Markdown editor (TipTap) for note types
- Shiki for syntax highlighting in read/display views
- One-click copy to clipboard on all items
- Keyboard shortcuts: Cmd+K command palette, Cmd+N new item
- File upload for file types (file/image)
- Export data as JSON or Markdown
- Dark mode (default for devs)
- Add/remove items to/from multiple collections
- View which collections an item belongs to

F. **AI Features**

- AI auto-tag suggestions
- AI Summaries
- AI Explain This Code
- Prompt optimizer

## Data

This is a rough mockup of what the data will look like. This is not set in stone:

**USER**

**ITEM**

- id
- title
- contentType (text | file)
- content (text content or null if file)
- fileUrl (R2 URL or null if text)
- fileName (original filename or null)
- fileSize (bytes or null)
- url (for link types)
- description
- isFavorite
- isPinned
- language (optional for code)
- createdAt
- updatedAt
- \*fields for user, itemType, tag relations (collection relation handled via join table)

**ITEMTYPE**

- id
- name
- icon
- color
- isSystem
- \*fields for user, item relations - user will be null for system types

**COLLECTION**

- id
- name ("React Hooks", "Prototype Prompts", "Context Files")
- description (optional)
- isFavorite
- defaultTypeId (for new - collections with no items)
- createdAt
- updatedAt
- \*fields for user relation (item relation handled via join table)

**ITEMCOLLECTION** (join table)

- itemId
- collectionId
- addedAt (tracks when item was added to collection)

**TAG**

- id
- name

## Tech Stack

- Framework Next.js 16 / React 19
- SSR pages with dynamic components.
- API routes for backend needs (storing items, file uploads, AI calls)
- One codebase/repo for less overhead
- TypeScript for type safety

**Database & ORM**
PostgreSQL & Drizzle

- Local PostgreSQL on Dokploy
- Drizzle ORM for database connection and interaction
- File Storage Cloudflare R2 for file uploads
- Authentication: better-auth (email/password only)
- IMPORTANT: NEVER directly update db structure. Always use drizzle-kit to generate migrations that will be run in dev and then in prod.

**AI Integration**

- Anthropic Claude Haiku model

**Editors & Highlighting**

- CodeMirror 6 for code-type items (snippets, commands, prompts)
- TipTap for note-type items (rich markdown)
- Shiki for syntax highlighting in display/read views

**CSS Frameworks**
Tailwind CSS v4 with ShadCN UI

## UI/UX

**General**

- Modern, minimal, developer-focused
- Dark mode by default, light mode optional
- Clean typography, generous whitespace
- Subtle borders and shadows
- Reference: Notion, Linear, Raycast
- Syntax highlighting for codeblocks

**Layout**

- Sidebar + main content (collapsible sidebar)
- Sidebar: Item types with links to items (Snippets, commands, etc), latest collections
- Main: Grid of color coded collection cards based on the items they hold the most of (background color). Items display under collections in color coded cards (border color)
- Individual items open in a quick to access drawer

**Type Colors & Icons**

- Snippet Color: #3b82f6 (blue)
- Snippet Icon: Code
- Prompt Color: #8b5cf6 (purple)
- Prompt Icon: Sparkles
- Command Color: #f97316 (orange)
- Command Icon: Terminal
- Note Color: #fde047 (yellow)
- Note Icon: StickyNote
- File Color: #6b7280 (gray)
- File Icon: File
- Image Color: #ec4899 (pink)
- Image Icon: Image
- Link Color: #10b981 (emerald)
- Link Icon: Link

**Responsive**

- Desktop-first but mobile usable
- Sidebar becomes drawer on mobile

**Micro-interactions:**

- Smooth transitions
- Hover states on cards
- Toast notifications for actions
- Loading skeletons
