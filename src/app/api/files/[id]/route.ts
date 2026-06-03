export const runtime = "edge";

import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { getItemById } from "@/lib/item-queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getItemById(id, session.user.id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const { item } = row;
  if (!item.fileUrl) return Response.json({ error: "No file attached" }, { status: 404 });

  const { env } = getCloudflareContext();
  const object = await env.dev_stash_files.get(item.fileUrl);
  if (!object) return Response.json({ error: "File not found" }, { status: 404 });

  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
  const disposition = contentType.startsWith("image/")
    ? "inline"
    : `attachment; filename="${item.fileName ?? "file"}"`;

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
