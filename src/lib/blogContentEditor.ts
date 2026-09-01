const IMAGE_MARKER_RE = /\[\[image:(\d+)\]\]/gi;
const ROW_MARKER_RE = /\[\[row:([\d,\s]+)\]\]/gi;

/** Ensure markers sit on their own lines between HTML blocks. */
export function normalizeBlogStorageContent(content: string): string {
  let c = String(content || "").trim();
  if (!c) return "";

  c = c.replace(IMAGE_MARKER_RE, "\n[[image:$1]]\n");
  c = c.replace(ROW_MARKER_RE, (_, nums) => `\n[[row:${String(nums).replace(/\s/g, "")}]]\n`);
  c = c.replace(/\n{3,}/g, "\n\n");

  c = c.replace(/<p>([\s\S]*?)<\/p>/gi, (full, inner) => {
    if (!/\[\[(?:image|row):/.test(inner)) return full;
    const parts: string[] = [];
    const chunks = inner.split(/(\[\[(?:image:\d+|row:[\d,]+)\]\])/gi);
    for (const chunk of chunks) {
      const t = chunk.trim();
      if (!t) continue;
      if (/^\[\[image:\d+\]\]$/i.test(t) || /^\[\[row:[\d,\s]+\]\]$/i.test(t)) {
        parts.push(t);
      } else {
        parts.push(`<p>${t}</p>`);
      }
    }
    return parts.join("\n");
  });

  return c.trim();
}

function markerDiv(type: "image" | "row", attrs: Record<string, string>): string {
  const base = `data-type="image-marker" data-marker-type="${type}"`;
  if (type === "image") {
    return `<div ${base} data-index="${attrs.index}"></div>`;
  }
  return `<div ${base} data-indices="${attrs.indices}"></div>`;
}

/** Convert stored blog content (HTML + [[image:N]] markers) to Tiptap-friendly HTML. */
export function storageToEditorHtml(content: string): string {
  const raw = normalizeBlogStorageContent(content);
  if (!raw) return "<p></p>";

  const parts = raw.split(/(\[\[image:\d+\]\]|\[\[row:[\d,\s]+\]\])/gi).filter(Boolean);
  const htmlParts: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const imageMatch = trimmed.match(/^\[\[image:(\d+)\]\]$/i);
    if (imageMatch) {
      htmlParts.push(markerDiv("image", { index: imageMatch[1] }));
      continue;
    }

    const rowMatch = trimmed.match(/^\[\[row:([\d,\s]+)\]\]$/i);
    if (rowMatch) {
      htmlParts.push(markerDiv("row", { indices: rowMatch[1].replace(/\s/g, "") }));
      continue;
    }

    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      htmlParts.push(trimmed);
    } else {
      trimmed.split(/\n\n+/).forEach((p) => {
        const t = p.trim();
        if (t) htmlParts.push(`<p>${t}</p>`);
      });
    }
  }

  return htmlParts.join("") || "<p></p>";
}

/** Convert Tiptap HTML back to stored format with [[image:N]] markers. */
export function editorHtmlToStorage(html: string): string {
  if (typeof document === "undefined") {
    return fallbackEditorHtmlToStorage(html);
  }

  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll('[data-type="image-marker"]').forEach((el) => {
    const type = el.getAttribute("data-marker-type");
    if (type === "image") {
      const idx = el.getAttribute("data-index") ?? "0";
      el.replaceWith(document.createTextNode(`\n[[image:${idx}]]\n`));
    } else if (type === "row") {
      const indices = el.getAttribute("data-indices") ?? "";
      el.replaceWith(document.createTextNode(`\n[[row:${indices}]]\n`));
    } else {
      el.remove();
    }
  });

  let out = root.innerHTML;
  out = out.replace(/<p>\s*(\[\[image:\d+\]\])\s*<\/p>/gi, "\n$1\n");
  out = out.replace(/<p>\s*(\[\[row:[\d,\s]+\]\])\s*<\/p>/gi, "\n$1\n");

  return normalizeBlogStorageContent(out);
}

function fallbackEditorHtmlToStorage(html: string): string {
  let out = html;
  out = out.replace(
    /<div[^>]*data-marker-type="image"[^>]*data-index="(\d+)"[^>]*>\s*<\/div>/gi,
    "\n[[image:$1]]\n",
  );
  out = out.replace(
    /<div[^>]*data-marker-type="row"[^>]*data-indices="([^"]+)"[^>]*>\s*<\/div>/gi,
    "\n[[row:$1]]\n",
  );
  return normalizeBlogStorageContent(out);
}

export type GalleryPreview = {
  index: number;
  url?: string;
  caption?: string;
  placement?: "cover" | "article" | "gallery";
  layout?: string;
};

/** Attach preview URLs to marker nodes for the editor UI. */
export function applyGalleryPreviewsToEditorHtml(
  html: string,
  gallery: GalleryPreview[],
): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll('[data-type="image-marker"]').forEach((el) => {
    const type = el.getAttribute("data-marker-type");
    if (type === "image") {
      const idx = Number(el.getAttribute("data-index"));
      const img = gallery.find((g) => g.index === idx);
      if (img?.url) el.setAttribute("data-preview-url", img.url);
      if (img?.caption) el.setAttribute("data-caption", img.caption);
      if (img?.layout) el.setAttribute("data-layout", img.layout);
      if (img?.placement) el.setAttribute("data-placement", img.placement);
    } else if (type === "row") {
      const indices = (el.getAttribute("data-indices") ?? "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
      const urls = indices
        .map((i) => gallery.find((g) => g.index === i)?.url)
        .filter(Boolean);
      const layouts = indices
        .map((i) => gallery.find((g) => g.index === i)?.layout || "inline")
        .join(",");
      if (urls.length) el.setAttribute("data-preview-urls", urls.join("|"));
      if (layouts) el.setAttribute("data-layouts", layouts);
    }
  });

  return root.innerHTML;
}
