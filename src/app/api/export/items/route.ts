import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAllItemsForExport } from "@/lib/item-queries";
import { getTagsForItems } from "@/lib/tag-queries";
import { buildJsonExport, buildMarkdownForItem, itemSlug } from "@/lib/export";
import { zipSync, strToU8 } from "fflate";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const rows = await getAllItemsForExport(session.user.id);
  const itemIds = rows.map(({ item }) => item.id);
  const tagsMap = await getTagsForItems(itemIds, session.user.id);

  const date = new Date().toISOString().slice(0, 10);

  if (format === "zip") {
    const files: Record<string, Uint8Array> = {};
    const slugCount: Record<string, number> = {};

    for (const row of rows) {
      const base = itemSlug(row.item.title);
      slugCount[base] = (slugCount[base] ?? 0) + 1;
      const name = slugCount[base] > 1 ? `${base}-${slugCount[base]}.md` : `${base}.md`;
      files[name] = strToU8(buildMarkdownForItem(row, tagsMap[row.item.id] ?? []));
    }

    const zip = zipSync(files);
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="devstash-export-${date}.zip"`,
      },
    });
  }

  const json = buildJsonExport(rows, tagsMap);
  return new Response(JSON.stringify(json, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="devstash-export-${date}.json"`,
    },
  });
}
