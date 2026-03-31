import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  emailAndPassword: { enabled: true },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
        if (allowedEmails.length === 0) return;
        const email = (ctx.body as { email?: string })?.email ?? "";
        if (!allowedEmails.includes(email)) {
          throw new APIError("FORBIDDEN", {
            message: "Sign up is restricted to invited users only.",
          });
        }
      }
    }),
  },
});
