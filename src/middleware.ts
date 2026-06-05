import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

// Edge middleware runs on the Cloudflare Workers runtime, which does not have
// access to the database or the signing keys needed for full session validation.
// `getSessionCookie` checks only for cookie presence, not cryptographic validity.
// A user with a forged or expired cookie can reach the HTML shell, but every
// server action and API route performs a full better-auth session check before
// returning any data, so no private data is exposed. This is an accepted
// trade-off for Edge-compatible route protection.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (sessionCookie && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!sessionCookie && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/upload|api/files|api/export|_next/static|_next/image|favicon.ico).*)",
  ],
};
