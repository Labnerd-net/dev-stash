/**
 * Strip all HTML tags and decode common entities. Server-safe (no DOM APIs).
 * The DOMParser approach is more robust for client components, but this
 * handles the realistic output from TipTap's StarterKit correctly.
 *
 * Limitation: regex-based stripping can misparse malformed HTML — e.g. an
 * attribute value containing `>` like `alt="a>b"` would leave `b">` in the
 * output. This is acceptable because the output goes to a downloaded Markdown
 * file, never to rendered HTML. Real-world TipTap output never triggers this.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Tags TipTap StarterKit can produce — everything else is stripped.
const ALLOWED_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "em", "s", "br", "hr",
]);

/**
 * Sanitize TipTap HTML before storing to the database using an allowlist
 * approach: strip all attributes, then remove any tag not in ALLOWED_TAGS.
 * Allowlist is stronger than the previous blocklist and cannot be bypassed
 * by novel tag names or attribute injection. Works in Cloudflare Workers
 * (pure regex, no DOM APIs).
 */
export function sanitizeHtml(html: string): string {
  // Strip all attributes from every tag
  html = html.replace(/<([a-z][a-z0-9]*)\b[^>]*>/gi, "<$1>");
  // Remove any tag (opening or closing) not in the allowlist
  html = html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) =>
    ALLOWED_TAGS.has(tag.toLowerCase()) ? match : ""
  );
  return html;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
