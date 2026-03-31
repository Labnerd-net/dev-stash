# Plan: Authentication (better-auth)

## Context

The project has better-auth v1.5.6 installed and a Postgres DB wired up via Drizzle. The existing `users` table is missing two fields required by better-auth (`name`, `emailVerified`) and three required auth tables (`sessions`, `accounts`, `verifications`) don't exist yet. No auth config, pages, or middleware exist. This plan wires everything together.

---

## Steps

### 1. Update Drizzle schema — `src/db/schema.ts`

Add two fields to the existing `users` table:
- `name` — `text().notNull()` (required by better-auth)
- `emailVerified` — `boolean().notNull().default(false)` (required by better-auth)

Add three new tables:

**`sessions`**
- `id` text PK
- `expiresAt` timestamp NOT NULL
- `token` text NOT NULL UNIQUE
- `createdAt` / `updatedAt` timestamps
- `ipAddress` text nullable
- `userAgent` text nullable
- `userId` text FK → users.id (cascade delete)

**`accounts`**
- `id` text PK
- `accountId` text NOT NULL
- `providerId` text NOT NULL
- `userId` text FK → users.id (cascade delete)
- `accessToken` / `refreshToken` / `idToken` text nullable
- `accessTokenExpiresAt` / `refreshTokenExpiresAt` timestamp nullable
- `scope` text nullable
- `password` text nullable (hashed password for email/password)
- `createdAt` / `updatedAt` timestamps

**`verifications`**
- `id` text PK
- `identifier` text NOT NULL
- `value` text NOT NULL
- `expiresAt` timestamp NOT NULL
- `createdAt` / `updatedAt` timestamps

### 2. Generate and apply migration

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3. Create `src/lib/auth.ts`

Server-side better-auth config:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
});
```

### 4. Create `src/lib/auth-client.ts`

Client-side auth client for use in Client Components:

```ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
```

### 5. Create `src/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 6. Create `src/app/sign-in/page.tsx`

Client Component with email/password form. Uses `authClient.signIn.email()`. On success, redirects to `/`. Shows inline error on failure.

### 7. Create `src/app/sign-up/page.tsx`

Client Component with name/email/password form. Uses `authClient.signUp.email()`. On success, redirects to `/`. Shows inline error on failure.

### 8. Create `src/middleware.ts`

Uses `getSessionCookie` from `better-auth/cookies` — lightweight cookie check, no DB call:
- Unauthenticated request to protected route → redirect to `/sign-in`
- Authenticated request to `/sign-in` or `/sign-up` → redirect to `/`
- API auth routes (`/api/auth/*`) always pass through

Protected routes: everything except `/sign-in`, `/sign-up`, `/api/auth/*`, and Next.js internals (`/_next/*`).

### 9. Update `src/app/page.tsx`

Make it a Server Component that calls `auth.api.getSession({ headers: await headers() })`. If no session, redirect to `/sign-in`. Otherwise render a minimal placeholder (will be replaced in the layout feature).

---

## Critical Files

| Action | File |
|--------|------|
| Modify | `src/db/schema.ts` |
| Create | `src/lib/auth.ts` |
| Create | `src/lib/auth-client.ts` |
| Create | `src/app/api/auth/[...all]/route.ts` |
| Create | `src/app/sign-in/page.tsx` |
| Create | `src/app/sign-up/page.tsx` |
| Create | `src/middleware.ts` |
| Modify | `src/app/page.tsx` |

---

## Open Questions Resolved

- **Sign-up open to all for MVP?** Yes — no allowlist for now.
- **Loading state?** Disable the submit button during submission.

---

## Verification

1. `npm run build` — must pass with no errors
2. Browse to `/` — should redirect to `/sign-in` (unauthenticated)
3. Sign up with a new email — should land on `/`
4. Sign out — should land on `/sign-in`
5. Sign in with correct credentials — should land on `/`
6. Sign in with wrong password — should show error inline
7. Visit `/sign-in` while authenticated — should redirect to `/`
