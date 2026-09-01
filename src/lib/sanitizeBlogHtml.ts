const ALLOWED_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "u",
  "a",
  "br",
  "hr",
  "blockquote",
  "figure",
  "figcaption",
  "span",
]);

const SAFE_TEXT_ALIGN = new Set(["left", "center", "right", "justify"]);

/** Allow only font-family and text-align in inline styles. */
function sanitizeStyleAttr(attrs: string): string {
  const styleMatch = attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (!styleMatch) return "";
  const raw = styleMatch[2] || styleMatch[3] || "";
  const safe: string[] = [];

  const ff = raw.match(/font-family\s*:\s*([^;]+)/i);
  if (ff) {
    const family = ff[1]
      .trim()
      .replace(/[<>"']/g, "")
      .slice(0, 120);
    if (family) safe.push(`font-family: ${family}`);
  }

  const fs = raw.match(/font-size\s*:\s*([^;]+)/i);
  if (fs) {
    const size = fs[1].trim().replace(/[<>"']/g, "").slice(0, 20);
    if (/^\d+(\.\d+)?(px|em|rem|%)$/.test(size)) safe.push(`font-size: ${size}`);
  }

  const col = raw.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  if (col) {
    const color = col[1].trim().replace(/[<>"']/g, "").slice(0, 48);
    if (
      /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|[a-z]+)$/i.test(
        color,
      )
    ) {
      safe.push(`color: ${color}`);
    }
  }

  const ta = raw.match(/text-align\s*:\s*([a-z-]+)/i);
  if (ta && SAFE_TEXT_ALIGN.has(ta[1].toLowerCase())) {
    safe.push(`text-align: ${ta[1].toLowerCase()}`);
  }

  if (!safe.length) return "";
  return ` style="${safe.join("; ")}"`;
}

function stripDangerous(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|svg|math|link|meta|base|form)[\s\S]*?>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|svg|math|link|meta|base|form)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "");
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

function openTag(tag: string, attrsRaw: string): string {
  const style = sanitizeStyleAttr(String(attrsRaw || ""));
  if (tag === "br") return "<br />";
  if (tag === "hr") return "<hr />";
  if (tag === "a") {
    const open = sanitizeAnchor(String(attrsRaw || ""));
    return open || "";
  }
  if (tag === "span") {
    return style ? `<span${style}>` : "<span>";
  }
  if (["p", "h1", "h2", "h3", "blockquote", "figure", "figcaption"].includes(tag)) {
    return style ? `<${tag}${style}>` : `<${tag}>`;
  }
  return `<${tag}>`;
}

/** Client-safe subset renderer for blog HTML from admin/AI. */
export function sanitizeBlogHtml(html: string): string {
  const cleaned = stripDangerous(String(html || ""));
  const sanitized = cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tagRaw, attrsRaw) => {
    const tag = String(tagRaw || "").toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    return openTag(tag, attrsRaw);
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
