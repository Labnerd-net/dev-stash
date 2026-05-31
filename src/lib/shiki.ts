import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { COMMON_LANGUAGES } from "@/lib/item-type-map";

type HighlighterCore = Awaited<ReturnType<typeof createHighlighterCore>>;

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("@shikijs/themes/one-dark-pro")],
      langs: [
        import("@shikijs/langs/bash"),
        import("@shikijs/langs/c"),
        import("@shikijs/langs/cpp"),
        import("@shikijs/langs/css"),
        import("@shikijs/langs/dockerfile"),
        import("@shikijs/langs/go"),
        import("@shikijs/langs/html"),
        import("@shikijs/langs/java"),
        import("@shikijs/langs/javascript"),
        import("@shikijs/langs/json"),
        import("@shikijs/langs/kotlin"),
        import("@shikijs/langs/markdown"),
        import("@shikijs/langs/php"),
        import("@shikijs/langs/python"),
        import("@shikijs/langs/ruby"),
        import("@shikijs/langs/rust"),
        import("@shikijs/langs/sql"),
        import("@shikijs/langs/swift"),
        import("@shikijs/langs/toml"),
        import("@shikijs/langs/typescript"),
        import("@shikijs/langs/yaml"),
      ],
      engine: createJavaScriptRegexEngine(),
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
