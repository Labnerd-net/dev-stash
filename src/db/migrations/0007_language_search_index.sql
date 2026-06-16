DROP INDEX IF EXISTS "items_search_idx";

CREATE INDEX "items_search_idx" ON "items" USING gin(
  to_tsvector('english',
    coalesce("title", '') || ' ' ||
    coalesce("content", '') || ' ' ||
    coalesce("description", '') || ' ' ||
    coalesce("language", '')
  )
);
