import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Item Types ───────────────────────────────────────────────────────────────

export const itemTypes = pgTable("item_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  isSystem: boolean("is_system").notNull().default(false),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
});

// ─── Items ────────────────────────────────────────────────────────────────────

export const items = pgTable(
  "items",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    contentType: text("content_type").notNull(), // "text" | "file"
    content: text("content"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    url: text("url"),
    description: text("description"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    isPinned: boolean("is_pinned").notNull().default(false),
    language: text("language"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    typeId: text("type_id")
      .notNull()
      .references(() => itemTypes.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("items_user_id_idx").on(table.userId)]
);

// ─── Collections ──────────────────────────────────────────────────────────────

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Item ↔ Collection (join table) ──────────────────────────────────────────

export const itemCollections = pgTable(
  "item_collections",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.collectionId] })]
);

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// ─── Item ↔ Tag (join table) ──────────────────────────────────────────────────

export const itemTags = pgTable(
  "item_tags",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.tagId] })]
);
