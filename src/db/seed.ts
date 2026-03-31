import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { itemTypes } from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const SYSTEM_ITEM_TYPES = [
  {
    id: "system_snippet",
    name: "Snippet",
    icon: "Code2",
    color: "#3b82f6", // blue
    isSystem: true,
    userId: null,
  },
  {
    id: "system_prompt",
    name: "Prompt",
    icon: "Sparkles",
    color: "#a855f7", // purple
    isSystem: true,
    userId: null,
  },
  {
    id: "system_note",
    name: "Note",
    icon: "FileText",
    color: "#f59e0b", // amber
    isSystem: true,
    userId: null,
  },
  {
    id: "system_command",
    name: "Command",
    icon: "Terminal",
    color: "#22c55e", // green
    isSystem: true,
    userId: null,
  },
  {
    id: "system_file",
    name: "File",
    icon: "File",
    color: "#94a3b8", // slate
    isSystem: true,
    userId: null,
  },
  {
    id: "system_image",
    name: "Image",
    icon: "Image",
    color: "#ec4899", // pink
    isSystem: true,
    userId: null,
  },
  {
    id: "system_url",
    name: "URL",
    icon: "Link",
    color: "#14b8a6", // teal
    isSystem: true,
    userId: null,
  },
];

async function seed() {
  console.log("Seeding system item types...");

  await db
    .insert(itemTypes)
    .values(SYSTEM_ITEM_TYPES)
    .onConflictDoNothing();

  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
