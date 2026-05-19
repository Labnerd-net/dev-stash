# DevStash

A centralized developer knowledge hub for storing and searching code snippets, AI prompts, notes, commands, URLs, files, and images — all in one place.

## Stack

- **Next.js 16** (App Router) + React 19
- **TypeScript** (strict mode)
- **Tailwind CSS v4** + shadcn/ui
- **PostgreSQL** + Drizzle ORM
- **better-auth** (email/password)
- **Anthropic Claude** (AI features)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host/dbname
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
ALLOWED_EMAILS=you@example.com  # comma-separated; leave empty to allow all
```

## Commands

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
