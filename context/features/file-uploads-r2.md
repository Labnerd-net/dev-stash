# Plan: File Uploads via Cloudflare R2

## Context

File and image item types exist in the schema and DB but have no working creation flow — the form shows only a title and description, the detail page renders nothing for the main content area, and `deleteItem` has no cleanup. This plan wires up the full pipeline using the existing `fileUrl`, `fileName`, `fileSize`, and `contentType` fields already on the `items` table.

Uploads proxy through the Worker (client → POST `/api/upload` → R2). Downloads are served via an authenticated GET endpoint (`/api/files/[id]`) that checks ownership and streams from R2 — this is equivalent security to TTL-based signed URLs without needing S3 API credentials. The R2 object key is stored in `fileUrl`; the download URL is never the raw key.

Constraints: 25 MB max, `image/*` only for image type, all MIME types for file type.

---

## Step 1 — R2 Infrastructure

**Create the bucket** (one-time CLI command the user runs):
```
wrangler r2 bucket create dev-stash-files
```

**`wrangler.jsonc`** — add binding alongside the existing cache bucket:
```json
{ "binding": "R2_BUCKET", "bucket_name": "dev-stash-files" }
```

**`worker-configuration.d.ts`** (create if it doesn't exist, or find wherever `CloudflareEnv` is typed) — add:
```typescript
R2_BUCKET: R2Bucket;
```

---

## Step 2 — Upload API Route (`src/app/api/upload/route.ts`)

New Edge-runtime route. Handles `POST /api/upload`.

- Check session via `auth.api.getSession`
- Parse FormData: `file` (File) and `typeId` (string)
- Validate file size ≤ 25 MB — return 413 if exceeded
- Validate MIME type: if `typeId === "system_image"`, reject non-`image/*` — return 415
- Generate key: `uploads/<userId>/<uuid>-<sanitized-filename>`
- Get R2 binding via `getCloudflareContext().env.R2_BUCKET`
- Write: `bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } })`
- Return `{ key, fileName: file.name, fileSize: file.size }`

---

## Step 3 — Download API Route (`src/app/api/files/[id]/route.ts`)

New Edge-runtime route. Handles `GET /api/files/[id]`.

- Check session
- Fetch item from DB by ID with ownership check (`getItemById`)
- If item has no `fileUrl` (key), return 404
- `bucket.get(item.fileUrl)` — stream response with correct `Content-Type` and `Content-Disposition` headers
- Return 404 if R2 object not found

---

## Step 4 — Update `TYPE_FIELD_CONFIG` (`src/lib/item-type-map.ts`)

Add `hasFile: boolean` to the config shape. Set `true` for `system_file` and `system_image`, `false` for all others. This mirrors the existing `hasContent`/`hasUrl` pattern and drives form and detail page conditionals.

---

## Step 5 — Update Server Actions (`src/actions/items.ts`)

**`createItem`**: For file types, read `fileKey`, `fileName`, `fileSize` from FormData (populated by the client after upload completes). Set `contentType: "file"`, store `fileUrl: fileKey`, `fileName`, `fileSize`. For non-file types, keep existing `contentType: "text"` path.

**`updateItem`**: Read `fileKey`, `oldFileKey` from FormData. If `fileKey` is present and differs from `oldFileKey`, delete the old R2 object (`bucket.delete(oldFileKey)`) then update item with new file metadata. If `fileKey` is absent (no new file selected), leave existing file metadata untouched.

**`deleteItem`**: Before deleting the DB row, read the item to get its `fileUrl`. If present, call `bucket.delete(fileUrl)`. Then proceed with DB delete. The R2 call goes via `getCloudflareContext().env.R2_BUCKET`.

No changes needed to `item-schemas.ts` — file metadata flows via separate FormData fields outside the Zod schema (same pattern as `collectionId` and `tagName` arrays).

---

## Step 6 — Update `ItemForm` (`src/components/items/ItemForm.tsx`)

Add file upload UI for `system_file` and `system_image` types, gated by `fieldConfig.hasFile`.

**Upload logic** (two-step, necessary because server actions don't support progress):
1. User selects file via `<input type="file">` — `onChange` fires immediately
2. Client POSTs file to `/api/upload` using `XMLHttpRequest` (supports `progress` event) with `typeId`
3. Progress bar updates during transfer
4. On success, store `key`, `fileName`, `fileSize` in component state → hidden inputs: `name="fileKey"`, `name="fileName"`, `name="fileSize"`
5. Form submission (server action) picks up the hidden inputs

For **edit mode**: also render a hidden input `name="oldFileKey"` with the existing key so `updateItem` knows which object to delete if replaced. Show the current file/image as a preview.

Error states: file too large, wrong MIME type (rejected by `/api/upload`), upload network error — display inline below the file picker.

State to add: `uploadState: "idle" | "uploading" | "done" | "error"`, `uploadProgress: number`, `fileKey/fileName/fileSize`.

---

## Step 7 — Update Item Detail Page (`src/app/(app)/items/[id]/page.tsx`)

Add a `hasFile` branch after the existing `hasUrl` and `hasContent` branches:

- **Image type**: render `<img src={/api/files/${item.id}} alt={item.fileName} />` with max-width constraint + download link below
- **File type**: render a download card showing `fileName`, formatted `fileSize`, and an `<a href="/api/files/${item.id}" download>` link

`fileSize` formatting: convert bytes to human-readable (KB/MB) — simple inline helper or small util function.

---

## Step 8 — Update `ItemRow` (`src/components/items/ItemRow.tsx`)

Update `getPreview()` to return `fileName` + formatted size for file/image types instead of the empty string that currently renders. This gives list views a meaningful preview line.

---

## Verification

1. Run `npm run preview` (Cloudflare Worker local dev at `localhost:8787`)
2. Create a file item: pick a file, verify progress bar appears, item is created, detail page shows download link, file downloads correctly
3. Create an image item: pick an image, verify preview renders on detail page
4. Edit a file item and replace the file: verify old R2 object is gone, new one loads
5. Edit a file item without replacing: verify existing file still loads
6. Delete a file item: verify R2 object is cleaned up (check via `wrangler r2 object list dev-stash-files`)
7. Try uploading a 26 MB file: verify rejection with error message
8. Try uploading a non-image as an image type: verify rejection
9. Verify unauthenticated access to `/api/files/[id]` returns 401
