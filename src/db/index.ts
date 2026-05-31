import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

type Db = ReturnType<typeof createDb>;

// Lazy singleton — defers neon() call until first use, so build-time imports don't fail
let _db: Db | undefined;

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
