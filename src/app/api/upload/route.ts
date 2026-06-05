import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";

const MAX_SIZE = MAX_UPLOAD_SIZE;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
]);

// Types that can execute or inject scripts when served inline or opened
const BLOCKED_FILE_TYPES = new Set([
  "image/svg+xml",
  "text/html",
  "application/javascript",
  "application/x-msdownload",
  "application/x-executable",
  "application/x-dosexec",
  "application/vnd.microsoft.portable-executable",
]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const typeId = formData.get("typeId");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof typeId !== "string") {
    return Response.json({ error: "No typeId provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File exceeds 25 MB limit" }, { status: 413 });
  }

  if (typeId === "system_image" && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only PNG, JPEG, GIF, WebP, and AVIF images are allowed" },
      { status: 415 }
    );
  }

  if (typeId === "system_file" && BLOCKED_FILE_TYPES.has(file.type)) {
    return Response.json(
      { error: "This file type is not allowed" },
      { status: 415 }
    );
  }

  const key = `uploads/${session.user.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

  const { env } = getCloudflareContext();
  await env.dev_stash_files.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ key, fileName: file.name, fileSize: file.size });
}
