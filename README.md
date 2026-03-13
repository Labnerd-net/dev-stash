# DevStash

A centralized developer knowledge hub for storing and searching code snippets, AI prompts, notes, commands, URLs, files, and images — all in one place.

## Stack

- **Next.js 16** (App Router) + React 19
- **TypeScript** (strict mode)
- **Tailwind CSS v4** + shadcn/ui
- **Neon PostgreSQL** + Prisma ORM
- **NextAuth v5** (email + GitHub OAuth)
- **Cloudflare R2** (file storage)
- **OpenAI gpt-5-nano** (AI features)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

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
  types/         # TypeScript types
  lib/           # Utilities and helpers
context/         # Project documentation and specs
```
