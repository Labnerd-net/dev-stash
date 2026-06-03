# Spec for file-uploads-r2

Title: File Uploads via Cloudflare R2
Branch: claude/feature/file-uploads-r2
Spec file: context/specs/file-uploads-r2.md

## Summary

Allow users to upload files and images directly to Cloudflare R2 storage. File and image item types currently exist in the schema but have no working creation flow. This feature wires up the full pipeline: R2 bucket binding in the Worker, a presigned-URL or direct-upload API route, file/image item create and edit UI, display in the item detail view, and cleanup (R2 deletion) when an item is deleted.

## Functional Requirements

- Configure R2 bucket binding in `wrangler.jsonc` and expose it to the app
- Provide an API route (or server action) that accepts a file upload and stores it in R2, returning a stable public or signed URL
- Show upload progress to the user during file transfer
- File item creation: title, optional description, tags, collection assignment — file picker uploads to R2, stores `fileUrl`, `fileName`, `fileSize` on the item
- Image item creation: same as file but with image preview before and after upload
- Edit flow: allow replacing the file/image (old file deleted from R2, new one uploaded)
- Item detail view for file type: display file name, size, a download link, and metadata
- Item detail view for image type: display the image inline with a download link below
- Delete item: when a file or image item is deleted, also delete the corresponding object from R2
- Existing file/image item rows in list views should show file name and size instead of content preview

## Possible Edge Cases

- Upload interrupted mid-way — partial object left in R2; needs cleanup or retry
- File size limit is 25 MB — enforced client-side and at the API route
- Image item type: images only (`image/*` MIME types); file item type: all MIME types accepted
- R2 object key collisions — use a user-scoped UUID-based key to avoid conflicts
- Editing an item without replacing the file — must not delete the existing R2 object
- Deleting an item that has no `fileUrl` (e.g. legacy or partially created) — must not error
- Large image files in the detail view — consider max-width/height constraints
- R2 signed URLs expire — need to decide TTL; short TTL is more secure but breaks direct links (e.g. in markdown); too long and they're effectively public

## Acceptance Criteria

- [ ] R2 bucket binding is configured and accessible inside the Worker runtime
- [ ] File items can be created end-to-end: pick file → upload → item saved with `fileUrl`/`fileName`/`fileSize`
- [ ] Image items can be created end-to-end with inline preview before submission
- [ ] Upload progress is visible in the UI
- [ ] File detail page shows name, size, and a working download link
- [ ] Image detail page renders the image inline
- [ ] Editing a file/image item and selecting a new file replaces the R2 object and updates the item
- [ ] Editing without selecting a new file leaves the existing R2 object untouched
- [ ] Deleting a file or image item removes the R2 object
- [ ] Max file size is enforced with a clear error message
- [ ] File/image rows in list views show file name and size instead of blank content

## Open Questions

- None remaining — all decisions made.

## Testing Guidelines

No test runner is configured. Verify manually in the browser:

- Upload a file and confirm the item is created with correct metadata
- Upload an image and confirm the preview renders in the detail view
- Edit an item and swap the file; confirm old object is gone from R2 and new one loads
- Delete a file item; confirm the R2 object is removed
- Attempt to upload a file over the size limit; confirm the error message appears

## Personal Opinion

This is a necessary feature — file and image types are dead without it. The main complexity is the upload pipeline choice (direct vs. proxied) and R2 object lifecycle (deletion on item delete, replacement on edit). Both are manageable.

Bucket is private. Uploads proxy through the Worker (client → Worker → R2) — simpler than direct presigned PUT, no CORS config needed. 100 MB Worker body limit applies; enforce a max file size below that. Signed URLs have a 1-hour TTL and are generated on demand in server components — only the R2 object key is stored in the DB, never the URL itself.
