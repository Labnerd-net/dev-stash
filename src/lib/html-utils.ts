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

/**
 * Sanitize TipTap HTML before storing to the database. Removes script injection
 * vectors while preserving the safe subset of tags StarterKit produces.
 * Works in Cloudflare Workers (pure regex, no DOM APIs).
 */
export function sanitizeHtml(html: string): string {
  // Remove dangerous elements and their entire content
  html = html.replace(
    /<(script|style|iframe|object|embed|form|input|textarea|button|select|link|meta|base)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  // Remove self-closing variants of the same dangerous tags
  html = html.replace(
    /<(script|style|iframe|object|embed|form|input|textarea|button|select|link|meta|base)\b[^>]*\/?>/gi,
    ""
  );
  // Remove all event handlers (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  // Remove javascript: and data: URLs from href/src/action attributes
  html = html.replace(
    /(\s+(?:href|src|action)\s*=\s*)(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*'|(?:javascript|data):[^\s>]*)/gi,
    ""
  );
  return html;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
