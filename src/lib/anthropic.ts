import { getCloudflareContext } from "@opennextjs/cloudflare";

const MAX_CONTENT_LENGTH = 4000;
const MODEL = "claude-haiku-4-5-20251001";

interface AnthropicResponse {
  content: { type: string; text: string }[];
}

export async function callHaiku(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const { env } = getCloudflareContext();
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const truncated =
    userContent.length > MAX_CONTENT_LENGTH
      ? userContent.slice(0, MAX_CONTENT_LENGTH) + "\n\n[content truncated]"
      : userContent;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: truncated }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const text = data.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("No text in Anthropic response");
  return text;
}
