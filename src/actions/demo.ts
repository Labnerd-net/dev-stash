"use server";

import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEMO_EMAIL, DEMO_RESET_INTERVAL_MS, DEMO_USER_ID } from "@/lib/demo";
import { resetDemoData } from "@/lib/demo-data";

type ActionResult = { success: boolean; error?: string };

export async function startDemo(): Promise<ActionResult> {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return { success: false, error: "The demo is not available right now." };

  try {
    const [demoUser] = await db
      .select({ updatedAt: users.updatedAt })
      .from(users)
      .where(eq(users.id, DEMO_USER_ID))
      .limit(1);
    if (!demoUser) return { success: false, error: "The demo is not available right now." };

    // Lazy reset: restore the seeded data if it is stale. No cron needed.
    if (Date.now() - demoUser.updatedAt.getTime() > DEMO_RESET_INTERVAL_MS) {
      await resetDemoData(db);
    }

    await auth.api.signInEmail({ body: { email: DEMO_EMAIL, password } });
    return { success: true };
  } catch (err) {
    const message =
      err instanceof APIError ? err.message : "Could not start the demo. Please try again.";
    return { success: false, error: message };
  }
}
