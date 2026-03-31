# Spec for Authentication

Title: Authentication
Branch: claude/feature/authentication
Spec file: context/specs/authentication.md

## Summary

Implement email/password authentication using better-auth with a Drizzle adapter. Users must be able to sign up, sign in, and sign out. All app routes are protected and redirect unauthenticated users to the sign-in page. Sessions persist across page navigations.

## Functional Requirements

- Configure better-auth with email/password provider
- Set up the Drizzle adapter so better-auth stores sessions/accounts in Postgres
- Sign-up page: email + password form, redirects to app on success
- Sign-in page: email + password form, redirects to app on success
- Sign-out: clears session and redirects to sign-in
- All routes under the app (e.g. `/`) are protected — unauthenticated users are redirected to `/sign-in`
- Sign-up and sign-in pages are public (no redirect loop)
- Session is accessible in server components and server actions via better-auth helpers

## Possible Edge Cases

- Duplicate email on sign-up should show a clear error
- Invalid credentials on sign-in should show a clear error
- Expired or invalid session should redirect to sign-in, not crash
- Sign-out while on a protected route should land on sign-in, not loop
- Middleware must not intercept static assets or API routes unintentionally

## Acceptance Criteria

- [ ] User can create an account with email + password
- [ ] User can sign in with correct credentials
- [ ] User is rejected with an error on wrong credentials
- [ ] Authenticated user can sign out
- [ ] Unauthenticated requests to protected routes redirect to `/sign-in`
- [ ] Authenticated requests to `/sign-in` or `/sign-up` redirect to `/`
- [ ] Session persists across page refresh

## Open Questions

- Should sign-up be open to anyone, or should there be an invite/allowlist for MVP? - just an allowlist for now
- Should we show a loading state during auth form submission or is a disabled button enough? - disabled button for now

## Testing Guidelines

- Test that the sign-up form submits and creates a user
- Test that the sign-in form rejects invalid credentials
- Test that protected routes redirect unauthenticated users
- Test that the session is valid after sign-in

## Personal Opinion

This is a straightforward and necessary step — better-auth with Drizzle is the right call given the stack. The Drizzle adapter keeps auth data in the same Postgres instance without extra complexity. No concerns here; this is well-scoped and not overly complex.
