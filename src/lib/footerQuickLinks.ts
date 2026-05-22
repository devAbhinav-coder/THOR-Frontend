export type FooterQuickLink = {
  label: string;
  href: string;
};

export const DEFAULT_FOOTER_QUICK_LINKS: FooterQuickLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop Sarees", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Journal", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Gifting", href: "/gifting" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
];

const ABOUT_LINK: FooterQuickLink = { label: "About", href: "/about" };

function normalizePath(href: string): string {
  const raw = String(href || "").trim();
  if (!raw) return "/";
  try {
    const url = new URL(raw.startsWith("/") ? raw : `/${raw}`, "https://dummy.local");
    return url.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return raw.split("?")[0]?.split("#")[0] || "/";
  }
}

/** Ensures /about is always in footer quick links (admin API may omit it). */
export function resolveFooterQuickLinks(
  apiLinks?: FooterQuickLink[] | null,
): FooterQuickLink[] {
  const base =
    apiLinks?.length ?
      apiLinks.map((l) => ({
        label: String(l.label || "").trim() || "Link",
        href: String(l.href || "/").trim() || "/",
      }))
    : [...DEFAULT_FOOTER_QUICK_LINKS];

  const hasAbout = base.some((l) => normalizePath(l.href) === "/about");
  if (hasAbout) return base;

  const shopIdx = base.findIndex((l) => {
    const p = normalizePath(l.href);
    return p === "/shop" || /shop/i.test(l.label);
  });
  const insertAt = shopIdx >= 0 ? shopIdx + 1 : Math.min(1, base.length);
  const next = [...base];
  next.splice(insertAt, 0, ABOUT_LINK);
  return next;
}
