# Project Backlog

> Generated: 2026-06-16
> Focus: Full audit

---

## Security

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Bugs

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Performance

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Improvements & Refactors

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Feature Ideas

### High
_None identified._

### Medium
- **#3 [future]**: No import flow for external content. Add an `/import` page supporting: paste multiple items (one per line), upload a JSON export file, or fetch a GitHub Gist URL and create items from parsed content.
- **#4 [src/app/api/export/]**: Export API only supports exporting all items or a single collection. Add `?type=` and `?tag=` query parameters to `/api/export/items` to enable filtered exports.

### Low
- **#5 [src/app/(app)/collections/[id]/]**: No way to duplicate an entire collection. Fix: add a "Duplicate" action on the collection detail page that clones metadata and item memberships.
- **#6 [future]**: No shareable item links. Items are fully private behind auth. Add an optional public/share toggle per item that generates a token-based read-only URL (e.g. `/share/abc123`).
- **#7 [future]**: No way to filter collections to favorites-only without browsing the full list. Fix: add a `/collections?filter=favorite` route with a filter chip UI matching the search page type-filter pattern.
- **#8 [future]**: No Cloudflare KV caching for frequently-read, rarely-changed data (tag lists, collection lists, dashboard stats). On hold — current single-user traffic doesn't justify the complexity.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 0 | 0 | 0 | 0 |
| Bugs | 0 | 0 | 0 | 0 |
| Performance | 0 | 0 | 0 | 0 |
| Improvements & Refactors | 0 | 0 | 0 | 0 |
| Feature Ideas | 0 | 2 | 4 | 6 |
| **Total** | **0** | **2** | **4** | **6** |
