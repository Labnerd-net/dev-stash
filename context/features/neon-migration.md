# Plan: Neon Postgres Migration

## Context

The app currently runs Postgres on a Dokploy self-hosted instance. The goal is to migrate to Neon (serverless Postgres) so the database is externally managed, removes the self-hosting dependency, and positions the app for a potential future Cloudflare Workers deployment. The schema and all data must be preserved.

## Steps

### 1. Create Neon Project

- Create a new project at neon.tech
- Note the connection string — Neon provides both a pooled and direct URL
- Set `DATABASE_URL` to the **pooled** connection string (port 5432 via pgbouncer) for the app
- Set `DATABASE_URL_UNPOOLED` to the direct connection string — required for Drizzle migrations (pgbouncer does not support the `CREATE INDEX CONCURRENTLY` and multi-statement transactions that migrations use)

### 2. Install Neon Serverless Driver

```bash
npm install @neondatabase/serverless
```

No removal of `pg` or `postgres` needed yet — keep existing driver until migration is verified.

### 3. Update Drizzle Client (`src/lib/db.ts`)

Swap the database client to use `@neondatabase/serverless` with the HTTP driver:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

Use `drizzle-orm/neon-http` (not `drizzle-orm/node-postgres`).

### 4. Update `drizzle.config.ts`

Point migrations at the **unpooled** connection string so `drizzle-kit migrate` works correctly:

```ts
dbCredentials: {
  url: process.env.DATABASE_URL_UNPOOLED!,
}
```

### 5. Run Migrations on Neon

With `DATABASE_URL_UNPOOLED` set in the environment:

```bash
npx drizzle-kit migrate
```

This applies all existing migrations (0000–0003) to the fresh Neon database and seeds system item types.

### 6. Migrate Existing Data

Export data from the Dokploy Postgres instance and import into Neon:

```bash
# On Dokploy host or via pg_dump with remote connection
pg_dump -Fc --no-acl --no-owner -d <DOKPLOY_DATABASE_URL> > devstash.dump

# Restore into Neon (use unpooled URL)
pg_restore --no-acl --no-owner -d <NEON_DATABASE_URL_UNPOOLED> devstash.dump
```

Alternatively use `psql` with a plain SQL dump if `pg_restore` is unavailable.

### 7. Update Environment Variables in Dokploy

In the Dokploy app environment config:
- Set `DATABASE_URL` → Neon pooled connection string
- Set `DATABASE_URL_UNPOOLED` → Neon direct connection string
- Remove or retire the old `DATABASE_URL` pointing to the Dokploy Postgres container

### 8. Build and Verify

```bash
npm run build
```

Then deploy and smoke-test:
- Sign in
- View items, collections, favorites, search
- Create a new item
- Check dashboard (stats, recently used)

## Files to Modify

### `src/lib/db.ts`
Swap driver from `drizzle-orm/node-postgres` (or `drizzle-orm/postgres-js`) to `drizzle-orm/neon-http` using `@neondatabase/serverless`.

### `drizzle.config.ts`
Change `dbCredentials.url` to use `DATABASE_URL_UNPOOLED` env var.

## Key Constraints

- Do **not** run migrations against the Neon pooled URL — pgbouncer will break them. Always use the direct/unpooled URL for `drizzle-kit`.
- The data export/import must happen during a maintenance window (or with the app in read-only mode) to avoid writes being lost between dump and restore.
- Neon's free tier has a 0.5 GB storage limit and auto-suspends after 5 minutes of inactivity — cold starts add ~500ms latency on the first query after sleep. Acceptable for a dev tool; upgrade if latency is a concern.
- `better-auth` session table and all user data must be included in the dump — verify row counts before and after restore.

## Verification

1. Run migrations on Neon and confirm all 4 migrations applied cleanly.
2. Confirm row counts in Neon match Dokploy Postgres for `users`, `items`, `collections`, `tags`, `sessions`.
3. Run `npm run build` — no type errors.
4. Deploy to Dokploy with new `DATABASE_URL` env vars and smoke-test all major flows.
5. Confirm sign-in still works (sessions table intact).
6. Confirm search returns results (GIN index recreated by migration 0003).
