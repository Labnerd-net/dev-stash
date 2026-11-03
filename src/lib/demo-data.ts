import { eq } from "drizzle-orm";
import type { db } from "@/db";
import {
  collections,
  itemCollections,
  items,
  itemTags,
  tags,
  userRecentlyViewed,
  users,
} from "@/db/schema";
import { DEMO_USER_ID } from "@/lib/demo";

type Db = typeof db;

interface DemoItem {
  key: string;
  typeId: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  tags: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
}

interface DemoCollection {
  key: string;
  name: string;
  description: string;
  isFavorite?: boolean;
  itemKeys: string[];
}

const DEMO_ITEMS: DemoItem[] = [
  {
    key: "use-debounce",
    typeId: "system_snippet",
    title: "useDebounce hook",
    description: "Debounce a fast-changing value, such as a search input",
    language: "typescript",
    tags: ["react", "hooks", "typescript"],
    isFavorite: true,
    isPinned: true,
    content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}`,
  },
  {
    key: "fetch-retry",
    typeId: "system_snippet",
    title: "fetch with retry and backoff",
    description: "Retry transient failures with exponential backoff",
    language: "typescript",
    tags: ["typescript", "http", "utils"],
    content: `export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status < 500 || attempt >= retries) return res;
    } catch (err) {
      if (attempt >= retries) throw err;
    }
    await new Promise((r) => setTimeout(r, 2 ** attempt * 250));
  }
}`,
  },
  {
    key: "python-groupby",
    typeId: "system_snippet",
    title: "Group a list of dicts by key",
    language: "python",
    tags: ["python", "utils"],
    content: `from collections import defaultdict

def group_by(rows, key):
    groups = defaultdict(list)
    for row in rows:
        groups[row[key]].append(row)
    return dict(groups)`,
  },
  {
    key: "code-review-prompt",
    typeId: "system_prompt",
    title: "Code review prompt",
    description: "Structured review focused on bugs, not style",
    tags: ["ai", "review"],
    isFavorite: true,
    content: `You are a senior engineer reviewing a pull request.

Review the diff below and report only:
1. Bugs or logic errors, with the exact line and a failing input
2. Security issues (auth checks, input validation, injection)
3. Performance problems with a concrete cost

Skip style and naming comments. If you find nothing, say so plainly.`,
  },
  {
    key: "commit-message-prompt",
    typeId: "system_prompt",
    title: "Conventional commit message",
    tags: ["ai", "git"],
    content: `Write a conventional commit message for the staged diff below.
Use the form "type: summary" with a summary under 72 characters.
Add a short body only if the reason for the change is not obvious.`,
  },
  {
    key: "api-design-notes",
    typeId: "system_note",
    title: "REST API design checklist",
    tags: ["api", "design"],
    isPinned: true,
    content:
      "<h2>Before shipping an endpoint</h2><ul><li>Use nouns for resources and HTTP verbs for actions</li><li>Return the right status code: <code>201</code> on create, <code>204</code> on delete, <code>409</code> on conflict</li><li>Validate every input and return field-level errors</li><li>Paginate every list endpoint</li><li>Make writes idempotent where a client might retry</li></ul><h2>Errors</h2><p>Return one consistent shape, for example <code>{ error: { code, message } }</code>, and never leak stack traces.</p>",
  },
  {
    key: "postgres-indexing-notes",
    typeId: "system_note",
    title: "Postgres indexing notes",
    tags: ["postgres", "performance"],
    content:
      "<h2>Rules of thumb</h2><ul><li>Index columns used in <code>WHERE</code>, <code>JOIN</code>, and <code>ORDER BY</code></li><li>Composite index order matters: equality columns first, range column last</li><li>Use <code>EXPLAIN ANALYZE</code> before and after adding an index</li><li>GIN indexes suit full-text search with <code>to_tsvector</code></li></ul>",
  },
  {
    key: "git-undo-commit",
    typeId: "system_command",
    title: "Undo last commit, keep changes staged",
    tags: ["git"],
    language: "bash",
    isFavorite: true,
    content: "git reset --soft HEAD~1",
  },
  {
    key: "docker-prune",
    typeId: "system_command",
    title: "Clean up unused Docker data",
    tags: ["docker"],
    language: "bash",
    content: "docker system prune --all --volumes --force",
  },
  {
    key: "find-large-files",
    typeId: "system_command",
    title: "Find the 20 largest files",
    tags: ["shell", "utils"],
    language: "bash",
    content: "find . -type f -exec du -h {} + | sort -rh | head -n 20",
  },
  {
    key: "react-docs",
    typeId: "system_url",
    title: "React documentation",
    description: "Official docs for hooks, components, and the React Compiler",
    url: "https://react.dev",
    tags: ["react", "docs"],
  },
  {
    key: "mdn",
    typeId: "system_url",
    title: "MDN Web Docs",
    description: "Reference for HTML, CSS, and JavaScript",
    url: "https://developer.mozilla.org",
    tags: ["docs", "web"],
  },
  {
    key: "tailwind-docs",
    typeId: "system_url",
    title: "Tailwind CSS documentation",
    url: "https://tailwindcss.com/docs",
    tags: ["css", "docs"],
  },
];

const DEMO_COLLECTIONS: DemoCollection[] = [
  {
    key: "react-patterns",
    name: "React Patterns",
    description: "Hooks, components, and docs for everyday React work",
    isFavorite: true,
    itemKeys: ["use-debounce", "react-docs", "tailwind-docs"],
  },
  {
    key: "git-and-shell",
    name: "Git and Shell",
    description: "Commands worth not retyping",
    itemKeys: ["git-undo-commit", "docker-prune", "find-large-files", "commit-message-prompt"],
  },
  {
    key: "backend-notes",
    name: "Backend Notes",
    description: "API design and database references",
    itemKeys: ["api-design-notes", "postgres-indexing-notes", "fetch-retry", "python-groupby"],
  },
];

const RECENTLY_VIEWED_KEYS = ["use-debounce", "api-design-notes", "git-undo-commit", "code-review-prompt"];

const HOUR_MS = 60 * 60 * 1000;

export async function resetDemoData(database: Db): Promise<void> {
  const now = Date.now();

  const itemIds = new Map(DEMO_ITEMS.map((i) => [i.key, crypto.randomUUID()]));
  const collectionIds = new Map(DEMO_COLLECTIONS.map((c) => [c.key, crypto.randomUUID()]));
  const tagIds = new Map(
    [...new Set(DEMO_ITEMS.flatMap((i) => i.tags))].map((name) => [name, crypto.randomUUID()])
  );

  const itemRows = DEMO_ITEMS.map((item, index) => ({
    id: itemIds.get(item.key)!,
    title: item.title,
    contentType: "text",
    content: item.content ?? null,
    url: item.url ?? null,
    description: item.description ?? null,
    language: item.language ?? null,
    isFavorite: item.isFavorite ?? false,
    isPinned: item.isPinned ?? false,
    userId: DEMO_USER_ID,
    typeId: item.typeId,
    createdAt: new Date(now - index * HOUR_MS),
    updatedAt: new Date(now - index * HOUR_MS),
  }));

  const itemTagRows = DEMO_ITEMS.flatMap((item) =>
    item.tags.map((name) => ({ itemId: itemIds.get(item.key)!, tagId: tagIds.get(name)! }))
  );

  const collectionRows = DEMO_COLLECTIONS.map((c) => ({
    id: collectionIds.get(c.key)!,
    name: c.name,
    description: c.description,
    isFavorite: c.isFavorite ?? false,
    userId: DEMO_USER_ID,
  }));

  const itemCollectionRows = DEMO_COLLECTIONS.flatMap((c) =>
    c.itemKeys.map((key) => ({
      itemId: itemIds.get(key)!,
      collectionId: collectionIds.get(c.key)!,
    }))
  );

  const recentRows = RECENTLY_VIEWED_KEYS.map((key, index) => ({
    userId: DEMO_USER_ID,
    itemId: itemIds.get(key)!,
    viewedAt: new Date(now - index * 10 * 60 * 1000),
  }));

  // Single batch = one atomic request on the Neon HTTP driver. Deleting items,
  // collections, and tags cascades to the join tables and recently-viewed rows.
  await database.batch([
    database.delete(items).where(eq(items.userId, DEMO_USER_ID)),
    database.delete(collections).where(eq(collections.userId, DEMO_USER_ID)),
    database.delete(tags).where(eq(tags.userId, DEMO_USER_ID)),
    database
      .insert(tags)
      .values([...tagIds].map(([name, id]) => ({ id, name, userId: DEMO_USER_ID }))),
    database.insert(items).values(itemRows),
    database.insert(itemTags).values(itemTagRows),
    database.insert(collections).values(collectionRows),
    database.insert(itemCollections).values(itemCollectionRows),
    database.insert(userRecentlyViewed).values(recentRows),
    database.update(users).set({ updatedAt: new Date(now) }).where(eq(users.id, DEMO_USER_ID)),
  ]);
}
