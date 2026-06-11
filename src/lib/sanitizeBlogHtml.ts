const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "a",
  "br",
  "blockquote",
  "figure",
  "figcaption",
]);

function stripDangerous(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function sanitizeAnchor(attrs: string): string {
  const hrefMatch = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = (hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || "").trim();
  if (!href || /^javascript:/i.test(href)) return "";
  const safe =
    href.startsWith("/") || href.startsWith("http://") || href.startsWith("https://") ?
      href
    : "";
  if (!safe) return "";
  return `<a href="${safe.replace(/"/g, "&quot;")}" rel="noopener noreferrer" target="_blank">`;
}

/** Client-safe subset renderer for blog HTML from admin/AI. */
export function sanitizeBlogHtml(html: string): string {
  const cleaned = stripDangerous(String(html || ""));
  const sanitized = cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tagRaw, attrsRaw) => {
    const tag = String(tagRaw || "").toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = full.startsWith("</");
    if (isClosing) return `</${tag}>`;
    if (tag === "br") return "<br />";
    if (tag === "a") {
      const open = sanitizeAnchor(String(attrsRaw || ""));
      return open || "";
    }
    if (tag === "blockquote" || tag === "figure" || tag === "figcaption" || tag === "p") {
      return `<${tag}>`;
    }
    return `<${tag}>`;
  });
  return cleanBlogHtml(sanitized);
}

/** Light cleanup only — preserve author/AI blockquotes as written. */
export function cleanBlogHtml(html: string): string {
  return String(html || "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .trim();
}
