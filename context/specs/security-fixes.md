# Spec for Security Fixes

Title: Security Fixes
Branch: claude/fix/security-fixes
Spec file: context/specs/security-fixes.md

## Summary

Address four security issues identified in the backlog audit. Three involve real attack vectors (XSS via unsanitized note HTML, broken R2 file references after item duplication, phantom R2 file keys submitted through FormData) and one is a surface reduction (unexport `purgeExpiredTrash` since it performs irreversible deletes and no client should be calling it directly).

## Functional Requirements

- **#1 — XSS in note rendering**: Note content is stored as HTML (from TipTap) and rendered via `dangerouslySetInnerHTML`. The existing `sanitizeHtml` utility in `src/lib/html-utils.ts` has a documented bypass. Re-sanitize at render time using the browser's `Sanitizer API` (or a server-side equivalent) before injecting into the DOM.
- **#2 — Broken R2 reference on duplicate**: `duplicateItem` copies `fileUrl` (an R2 object key) from the source item to the duplicate. Both rows then point to the same R2 object. When either is permanently deleted, the object is removed and the other item has a dangling reference. Fix: omit `fileUrl`, `fileName`, and `fileSize` from duplicated file/image items so they are created without a file, avoiding the shared-key problem.
- **#3 — Unvalidated fileKey from FormData**: `fileKey` is read directly from FormData and stored in the DB without verifying the object exists in R2. A user can craft a form submission with an arbitrary key (as long as it starts with `uploads/<their-userId>/`) to create phantom file references. Fix: after the prefix ownership check, call `env.dev_stash_files.head(fileKey)` to confirm the object exists before inserting or updating.
- **#4 — purgeExpiredTrash export surface**: `purgeExpiredTrash` is an exported `"use server"` function that performs irreversible `DELETE` operations. No client UI calls it directly — it is only called from the `/trash` server component. Convert it to a non-exported (module-private) function to eliminate the unnecessary attack surface.

## Possible Edge Cases

- **#1**: The `Sanitizer API` is not available in all environments. Cloudflare Workers run V8 but without a full DOM — need to verify availability or use a server-safe alternative.
- **#2**: After fix, duplicating a file/image item will produce a duplicate with no file attached. The user will need to manually re-upload. This should be clearly reflected in the UI or noted in the duplicate action's confirmation.
- **#3**: The R2 `head()` call adds a round-trip on every create/edit of file/image items. If the object was just uploaded (race condition between upload and form submit), it should exist. Failure should return a clear validation error to the user.
- **#4**: Removing the export means the function can only be called from within `src/actions/trash.ts` itself. Verify no other file imports or calls it.

## Acceptance Criteria

- Note items with malicious HTML in content cannot execute scripts when rendered on the detail page
- Duplicating a file or image item produces a new item with no file attached (no shared R2 key)
- Submitting a `fileKey` that does not exist in R2 returns a validation error and does not create a DB record
- `purgeExpiredTrash` is not exported and cannot be imported from outside `src/actions/trash.ts`
- `npm run build` passes with no type errors

## Open Questions

- For #1: Is the `Sanitizer API` available in the Cloudflare Workers + Next.js edge runtime? If not, should sanitization happen server-side (strip disallowed tags before storing) or client-side (sanitize before rendering)?
- For #2: Should the duplicate UI indicate that file/image items will be duplicated without their file, or is silent omission acceptable?

## Testing Guidelines

No automated test runner is configured. Manual verification:
- Create a note with `<script>alert(1)</script>` in content via the TipTap editor. View the item detail page — no alert should fire and the script tag should not appear in the DOM.
- Create a file/image item, duplicate it, verify the duplicate has no file attached and the original's file still downloads correctly.
- Use browser DevTools to submit a create-item form with a fake `fileKey` value — confirm a validation error is returned.
- Confirm `purgeExpiredTrash` does not appear in any import statements outside `src/actions/trash.ts`.

## Personal Opinion

All four fixes are worth doing. #1 and #3 are real security holes — #1 because TipTap allows arbitrary HTML and the current sanitizer has a documented bypass, #3 because FormData is user-controlled. #2 is a data-integrity bug that will cause silent failures for any user who duplicates file items. #4 is a low-effort hardening step that costs nothing.

The main uncertainty is #1 in the Cloudflare Workers environment — if the Sanitizer API isn't available server-side, the safest fallback is to sanitize with a known-good library at write time (on `createItem`/`updateItem`) rather than render time. That would require touching the item actions but gives stronger guarantees. Worth investigating before implementing.

Complexity: low-to-medium. #4 is trivial. #2 and #3 are small targeted changes. #1 requires environment research first.
