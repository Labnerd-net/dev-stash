# DevStash

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live demo: [devstash.labnerd.net](https://devstash.labnerd.net/)**. Click **Try the demo** to
explore without signing up — it creates a throwaway account that resets hourly.

<!-- TODO: add 2-3 screenshots (dashboard, item editor, command palette)
![Dashboard](docs/screenshots/dashboard.png)
![Item editor](docs/screenshots/editor.png)
-->

A centralized developer knowledge hub for storing and searching code snippets, AI prompts,
notes, commands, URLs, files, and images — all in one place, instead of scattered across editor
snippets, chat history, bookmarks and random text files.

## Features

- **Seven item types** (snippet, prompt, note, command, file, image, URL), plus custom types
- **Collections** for organizing mixed item types together
- **Full-text search** across content, tags, titles and types (Postgres `to_tsvector`)
- **Favorites, pinned items, and a "recently used" list**
- **Command palette** (`Cmd+K`) for fast navigation and item creation (`Cmd+N`)
- **AI features** (Anthropic Claude Haiku): auto-tagging, summaries, "explain this code," and prompt optimization
- **Rich editing**: CodeMirror 6 for code-type items, TipTap for notes, Shiki for syntax-highlighted display views
- **File uploads** to Cloudflare R2 (images, docs, templates)
- **Export** to JSON or Markdown
- **One-click demo mode** — no signup required

## Engineering Highlights

- **AI endpoints built with an explicit trust boundary.** The tag-suggestion and summary actions document their own trade-off in code: any authenticated user can send arbitrary content under the app's shared Anthropic API key, mitigated by a 4000-character truncation on every call. Flagged as acceptable for a single-user deployment with a note to add per-user rate limiting before opening to untrusted users — the kind of limitation that's easy to miss and easy to regret.
- **Demo mode is isolated by construction.** A reserved demo account (`demo@devstash.app`) is reset on a fixed interval rather than sharing state with real users, so visitors can explore freely without the data living forever or colliding with anyone else's.
- **Full-text search without a search service.** Postgres's own `to_tsvector`/`tsquery` indexes content, tags, titles and types — no Elasticsearch, no external dependency, for a workload that doesn't need one.
- **Three different editors, one consistent experience.** CodeMirror 6 (code), TipTap (rich text notes) and Shiki (read-only syntax highlighting) are each the right tool for their item type rather than forcing one editor to do everything.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | better-auth (email/password) |
| AI | Anthropic Claude Haiku (auto-tagging, summaries, code explanations) |
| Editing | CodeMirror 6 (code), TipTap (notes), Shiki (display highlighting) |
| File storage | Cloudflare R2 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Deployment | Dokploy (self-hosted) |

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Environment Variables

```
DATABASE_URL=postgresql://user:password@host/dbname
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
ALLOWED_EMAILS=you@example.com  # comma-separated; leave empty to allow all
```

### Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
  app/           # Next.js App Router pages and layouts
  components/    # UI components
  actions/       # Server Actions
  lib/           # Utilities and helpers
  db/            # Drizzle schema, migrations, seed
context/         # Project documentation and specs
```

## License

[MIT](./LICENSE)
