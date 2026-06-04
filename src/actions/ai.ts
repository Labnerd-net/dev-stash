"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getItemById } from "@/lib/item-queries";
import { callHaiku } from "@/lib/anthropic";

type AiResult<T = string> = { success: boolean; data?: T; error?: string };

function buildItemContext(item: {
  title: string;
  content: string | null;
  description: string | null;
  url: string | null;
}): string {
  const parts: string[] = [`Title: ${item.title}`];
  if (item.description) parts.push(`Description: ${item.description}`);
  if (item.url) parts.push(`URL: ${item.url}`);
  if (item.content) parts.push(`Content:\n${item.content}`);
  return parts.join("\n\n");
}

export async function suggestTagsFromContent(input: {
  title: string;
  content: string;
  typeId: string;
}): Promise<AiResult<string[]>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  if (!input.title.trim()) return { success: false, error: "Title is required for tag suggestions" };

  const context = `Title: ${input.title}\n\nContent:\n${input.content}`;

  try {
    const result = await callHaiku(
      "You are a tagging assistant for a developer knowledge base. Given an item's details, suggest 3 to 6 short, relevant tags. Return ONLY the tags as a comma-separated list on a single line, lowercase, no punctuation. Example: javascript, react, hooks, performance",
      context
    );
    const tags = result
      .split(/[,\n]/)
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter((t) => t.length > 0 && t.length <= 50)
      .slice(0, 6);
    return { success: true, data: tags };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "AI request failed" };
  }
}

export async function explainCode(itemId: string): Promise<AiResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const row = await getItemById(itemId, session.user.id);
  if (!row) return { success: false, error: "Item not found" };

  const { item } = row;
  if (!item.content) return { success: false, error: "No code content to explain" };

  try {
    const result = await callHaiku(
      "You are a code explainer for developers. Explain what the given code or command does in plain English. Be concise and practical — focus on what it does and why someone would use it. Avoid restating the code itself. Use plain text only — no markdown, no bold, no bullet points, no headers.",
      `Language: ${item.language ?? "unknown"}\n\n${item.content}`
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "AI request failed" };
  }
}

export async function summarizeItem(itemId: string): Promise<AiResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const row = await getItemById(itemId, session.user.id);
  if (!row) return { success: false, error: "Item not found" };

  const { item } = row;
  const content = item.content ?? item.description;
  if (!content) return { success: false, error: "No content to summarize" };

  try {
    const result = await callHaiku(
      "You are a summarization assistant. Summarize the given content in 2 to 3 concise sentences. Focus on the key purpose and main points. Use plain text only — no markdown, no bold, no bullet points, no headers.",
      buildItemContext(item)
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "AI request failed" };
  }
}

export async function optimizePrompt(itemId: string): Promise<AiResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const row = await getItemById(itemId, session.user.id);
  if (!row) return { success: false, error: "Item not found" };

  const { item } = row;
  if (!item.content) return { success: false, error: "No prompt content to optimize" };

  try {
    const result = await callHaiku(
      "You are a prompt engineering expert. Rewrite the given AI prompt to be clearer, more specific, and more effective. Preserve the original intent but improve structure, clarity, and instruction quality. Return ONLY the improved prompt, no explanation or preamble.",
      item.content
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "AI request failed" };
  }
}
