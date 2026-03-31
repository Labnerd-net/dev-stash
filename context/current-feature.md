# Current Feature

## Current Feature Spec File

Title: Database Schema + Migration
Branch: claude/feature/db-schema

## Plan

1. Create `src/db/schema.ts` with Drizzle schema for all tables
2. Create `src/db/index.ts` for the DB client
3. Create `drizzle.config.ts` at project root
4. Generate migration with `drizzle-kit generate`
5. Apply migration with `drizzle-kit migrate`
6. Verify tables exist in local Postgres

## History

<!-- Keep this updated. Earliest to latest -->
- ...
