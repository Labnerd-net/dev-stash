# Spec for Cloudflare Workers Migration

Title: Cloudflare Workers Migration
Branch: claude/feature/cloudflare-workers-migration
Spec file: context/specs/cloudflare-workers-migration.md

## Summary

Migrate the deployment target from Dokploy (standalone Docker + Node.js) to Cloudflare Workers using `@opennextjs/cloudflare`. The Neon Postgres migration (already complete) removed the last Node.js-only database dependency, making this feasible. The goal is to serve the Next.js app on Cloudflare's edge network.

## Functional Requirements

- App builds for Cloudflare Workers using `@opennextjs/cloudflare`
- `wrangler.toml` is configured with the `nodejs_compat` compatibility flag so `better-auth` works on the edge runtime
- `src/lib/shiki.ts` is rewritten to use `shiki/core` fine-grained bundle with the JavaScript regex engine (no WASM, which Workers does not support by default)
- The `pg` package is removed from `dependencies` (uses Node.js `net` module, incompatible with Workers)
- `package.json` scripts are updated to include Workers build and deploy commands
- `next.config.ts` has `output: "standalone"` removed (replaced by the Workers build)
- Environment variables (DATABASE_URL, DATABASE_URL_UNPOOLED, BETTER_AUTH_SECRET, BETTER_AUTH_URL, ALLOWED_EMAILS) are configured as Wrangler secrets

## Possible Edge Cases

- Shiki language grammars that fail to load silently on the JS engine vs Oniguruma — need fallback to `text` to remain
- `better-auth` session cookie behavior may differ slightly under `nodejs_compat` vs full Node.js — test sign-in and session persistence
- Workers bundle size approaching the 1MB compressed limit after Shiki fine-grained bundle is applied

## Acceptance Criteria

- `npx @opennextjs/cloudflare build` completes without errors
- `npm run build` (standard Next.js build) still works for local dev reference
- Shiki syntax highlighting renders correctly on item detail pages in the Workers environment
- Sign-in, session persistence, and sign-out work correctly
- All item type list pages, search, and collections pages load correctly

## Open Questions

- None — all blockers were researched and resolved before planning (better-auth edge support confirmed, Shiki fine-grained bundle path confirmed, OpenNext migrate command confirmed)

## Testing Guidelines

No automated test runner is configured. Manual verification in the browser after `wrangler dev`:
- Sign in and verify session persists across page navigations
- Create a snippet item and verify Shiki highlighting renders on the detail page
- Verify search works
- Verify collections page loads

## Personal Opinion

Good move. The Neon migration was the right prerequisite — it removed the only hard blocker. The changes required are well-scoped: one config file added, two files modified (shiki.ts, next.config.ts), one dependency removed. The `@opennextjs/cloudflare migrate` command automates most of the scaffolding. No risk to auth, data, or business logic. Shiki rewrite is mechanical given the language list is already enumerated. Low complexity, high value.
