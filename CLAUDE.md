# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner is configured.

## Stack

- Next.js 16 (App Router) with React 19
- TypeScript (strict mode)
- Tailwind CSS v4 (via PostCSS)
- React Compiler enabled (`reactCompiler: true` in next.config.ts)

## Architecture

This is a fresh Next.js App Router project. The entry point is [src/app/page.tsx](src/app/page.tsx). The root layout at [src/app/layout.tsx](src/app/layout.tsx) loads Geist fonts and wraps all pages.

Path alias `@/*` maps to `./src/*`.

ESLint uses `eslint-config-next` (core-web-vitals + typescript rules) with flat config format.

## Auth

- Auth is handled by **better-auth** (`src/lib/auth.ts`) with the Drizzle adapter (`usePlural: true`)
- Client-side auth via `src/lib/auth-client.ts` — import `authClient` in client components
- Server-side session via `auth.api.getSession({ headers: await headers() })` in server components
- Route protection is in `src/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`)
- Sign-up is restricted by `ALLOWED_EMAILS` env var (comma-separated); empty = open to all

**IMPORTANT:** Do not add Claude to any commit messages