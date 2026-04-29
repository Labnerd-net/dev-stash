CREATE INDEX "items_search_idx" ON "items" USING gin(
  to_tsvector('english',
    coalesce("title", '') || ' ' ||
    coalesce("content", '') || ' ' ||
    coalesce("description", '')
  )
);
