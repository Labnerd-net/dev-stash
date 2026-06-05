import type { ItemForExport } from "@/lib/item-queries";
import { stripHtml } from "@/lib/html-utils";

export function itemSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "item";
}

export function buildJsonExport(
  rows: ItemForExport[],
  tagsMap: Record<string, string[]>
) {
  return {
    exportedAt: new Date().toISOString(),
    itemCount: rows.length,
    items: rows.map(({ item, typeName }) => ({
      id: item.id,
      title: item.title,
      type: typeName,
      contentType: item.contentType,
      content: item.content ?? null,
      url: item.url ?? null,
      description: item.description ?? null,
      language: item.language ?? null,
      fileName: item.fileName ?? null,
      fileSize: item.fileSize ?? null,
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      tags: tagsMap[item.id] ?? [],
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

export function buildMarkdownForItem(
  { item, typeName }: ItemForExport,
  tags: string[]
): string {
  const lines: string[] = [];

  lines.push(`# ${item.title}`);
  lines.push(`**Type:** ${typeName}`);
  if (tags.length > 0) lines.push(`**Tags:** ${tags.join(", ")}`);
  lines.push(`**Created:** ${item.createdAt.toISOString()}`);
  lines.push("");

  if (item.contentType === "file") {
    if (item.fileName) {
      lines.push(`**File:** ${item.fileName}${item.fileSize ? ` (${Math.round(item.fileSize / 1024)} KB)` : ""}`);
    }
    if (item.description) lines.push("", item.description);
  } else {
    if (item.url) lines.push(`**URL:** ${item.url}`, "");
    if (item.content) {
      const content = typeName === "Note" ? stripHtml(item.content) : item.content;
      lines.push(content);
    } else if (item.description) {
      lines.push(item.description);
    }
  }

  return lines.join("\n");
}
