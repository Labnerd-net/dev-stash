import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashPassword } from "better-auth/crypto";
import * as schema from "./schema";
import { DEMO_EMAIL, DEMO_USER_ID } from "@/lib/demo";
import { resetDemoData } from "@/lib/demo-data";

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle(sql, { schema });

async function seedDemo() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error("DEMO_PASSWORD is required");

  console.log("Seeding demo user...");
  const passwordHash = await hashPassword(password);

  await db
    .insert(schema.users)
    .values({
      id: DEMO_USER_ID,
      name: "Demo User",
      email: DEMO_EMAIL,
      emailVerified: true,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.accounts)
    .values({
      id: `${DEMO_USER_ID}_credential`,
      accountId: DEMO_USER_ID,
      providerId: "credential",
      userId: DEMO_USER_ID,
      password: passwordHash,
    })
    .onConflictDoUpdate({
      target: schema.accounts.id,
      set: { password: passwordHash, updatedAt: new Date() },
    });

  console.log("Seeding demo data...");
  await resetDemoData(db);

  console.log("Demo account ready.");
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
