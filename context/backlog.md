# Project Backlog

> Generated: 2026-06-04
> Focus: Full audit

---

## Feature Ideas

### Medium
- **#32 [src/components/dashboard/RecentlyUsedSection.tsx]**: Recently used is localStorage-only (browser-specific). Add a `userRecentlyUsed(userId, itemId, viewedAt)` DB table to track views cross-device and enable a `/recently-used` history page.
### Low
- **#37 [future]**: No soft-delete / trash. Deleted items are permanently gone. Add a `deletedAt` column to items and collections for a 30-day recovery window.
- **#38 [future]**: No Cloudflare KV caching for frequently-read, rarely-changed data (tag lists, collection lists, dashboard stats). At scale, adding a KV cache layer with revalidation on mutation would reduce DB round-trips meaningfully.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Feature Ideas | 0 | 1 | 2 | 3 |
| **Total** | **0** | **1** | **2** | **3** |

> Last updated: 2026-06-15
