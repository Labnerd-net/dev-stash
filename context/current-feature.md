# Current Feature

## Current Feature Spec File

Title:
Spec file:
Branch:

## Current Feature Plan File

Plan file:

## History

<!-- Keep this updated. Earliest to latest -->
- Database Schema + Migration: defined Drizzle schema, generated and applied migration, seeded system item types
- Authentication: configured better-auth with Drizzle adapter, email/password sign-up/sign-in/sign-out, route protection via proxy.ts, ALLOWED_EMAILS allowlist
- App Shell and Dashboard: (app) route group with session guard layout, collapsible sidebar with item type nav + collections, header with search/actions/user area, dashboard stats cards, stub pages for all item types
- Docker Deployment: multi-stage Dockerfile with standalone output, entrypoint.sh runs drizzle migrations on startup, deployed to Dokploy with external Postgres; requires BETTER_AUTH_URL, BETTER_AUTH_SECRET, DATABASE_URL env vars
- DbGate Deployment: deployed DbGate (dbgate/dbgate:latest) to Dokploy under a new "Tools" project, configured at https://dbgate.labnerd.net with Let's Encrypt SSL and LOGIN/PASSWORD authentication
