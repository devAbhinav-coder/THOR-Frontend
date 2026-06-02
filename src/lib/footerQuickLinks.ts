export type FooterQuickLink = {
  label: string;
  href: string;
};

/** Curatorial — brand & explore (support links live under Concierge). */
export const DEFAULT_FOOTER_CURATORIAL_LINKS: FooterQuickLink[] = [
  { label: "Our Story", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Shop", href: "/shop" },
  { label: "Gifting", href: "/gifting" },
];

const OUR_STORY_LINK: FooterQuickLink = {
  label: "Our Story",
  href: "/about",
};

const BLOG_LINK: FooterQuickLink = { label: "Blog", href: "/blog" };

const CURATORIAL_ORDER = ["/about", "/blog", "/shop", "/gifting"];

/** Paths reserved for Concierge — not shown in Curatorial. */
const CONCIERGE_PATHS = new Set([
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
  "/about",
  "/faq",
]);

const LABEL_OVERRIDES: Record<string, string> = {
  "/about": "Our Story",
  "/blog": "Blog",
};

function normalizePath(href: string): string {
  const raw = String(href || "").trim();
  if (!raw) return "/";
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
  try {
    const url = new URL(raw.startsWith("/") ? raw : `/${raw}`, "https://dummy.local");
    return url.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return raw.split("?")[0]?.split("#")[0] || "/";
  }
}

function normalizeLabel(path: string, label: string): string {
  const override = LABEL_OVERRIDES[path];
  if (override) return override;
  const trimmed = String(label || "").trim();
  if (/^journal$/i.test(trimmed)) return "Blog";
  if (/^about$/i.test(trimmed)) return "Our Story";
  if (/^shop sarees$/i.test(trimmed)) return "Shop";
  return trimmed || "Link";
}

function sortCuratorialLinks(links: FooterQuickLink[]): FooterQuickLink[] {
  return [...links].sort((a, b) => {
    const ai = CURATORIAL_ORDER.indexOf(normalizePath(a.href));
    const bi = CURATORIAL_ORDER.indexOf(normalizePath(b.href));
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function resolveFooterCuratorialLinks(
  apiLinks?: FooterQuickLink[] | null,
): FooterQuickLink[] {
  const source =
    apiLinks?.length ?
      apiLinks.map((l) => ({
        label: String(l.label || "").trim() || "Link",
        href: String(l.href || "/").trim() || "/",
      }))
    : [...DEFAULT_FOOTER_CURATORIAL_LINKS];

  const seen = new Set<string>();
  const result: FooterQuickLink[] = [];

  for (const item of source) {
    const path = normalizePath(item.href);
    if (CONCIERGE_PATHS.has(path)) continue;
    if (seen.has(path)) continue;
    seen.add(path);
    result.push({
      href: item.href,
      label: normalizeLabel(path, item.label),
    });
  }

  if (!result.some((l) => normalizePath(l.href) === "/about")) {
    result.unshift(OUR_STORY_LINK);
  }

  if (!result.some((l) => normalizePath(l.href) === "/blog")) {
    const storyIdx = result.findIndex(
      (l) => normalizePath(l.href) === "/about",
    );
    result.splice(storyIdx >= 0 ? storyIdx + 1 : 0, 0, BLOG_LINK);
  }

  return sortCuratorialLinks(result);
}

/** @deprecated Use resolveFooterCuratorialLinks */
export const DEFAULT_FOOTER_QUICK_LINKS = DEFAULT_FOOTER_CURATORIAL_LINKS;

/** @deprecated Use resolveFooterCuratorialLinks */
export function resolveFooterQuickLinks(
  apiLinks?: FooterQuickLink[] | null,
): FooterQuickLink[] {
  return resolveFooterCuratorialLinks(apiLinks);
}
