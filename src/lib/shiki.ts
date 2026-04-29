import { createHighlighter } from "shiki";
import { COMMON_LANGUAGES } from "@/lib/item-type-map";

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["one-dark-pro"],
      langs: [...COMMON_LANGUAGES],
    });
  }
  return highlighterPromise;
}

const SUPPORTED_LANGS = new Set<string>(COMMON_LANGUAGES);

export async function highlightCode(code: string, language?: string | null): Promise<string> {
  const highlighter = await getHighlighter();
  const lang = language && SUPPORTED_LANGS.has(language) ? language : "text";
  return highlighter.codeToHtml(code, { lang, theme: "one-dark-pro" });
}
