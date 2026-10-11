import type { Product, MarketingEdition } from "@/types";

export type { MarketingEdition };

export function normalizeMarketingEditionSlug(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
}

export function isMarketingEditionLive(
  edition: Pick<MarketingEdition, "isActive" | "startsAt" | "endsAt">,
  now = new Date(),
): boolean {
  if (!edition.isActive) return false;
  const ts = now.getTime();
  if (edition.startsAt) {
    const start = Date.parse(edition.startsAt);
    if (Number.isFinite(start) && ts < start) return false;
  }
  if (edition.endsAt) {
    const end = Date.parse(edition.endsAt);
    if (Number.isFinite(end) && ts > end) return false;
  }
  return true;
}

export function listLiveMarketingEditions(
  editions: MarketingEdition[] | null | undefined,
  now = new Date(),
): MarketingEdition[] {
  if (!Array.isArray(editions)) return [];
  return editions
    .filter((e) => e?.slug && isMarketingEditionLive(e, now))
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.label.localeCompare(b.label),
    );
}

export function marketingEditionPath(slug: string): string {
  const safe = normalizeMarketingEditionSlug(slug);
  return `/shop/edits/${encodeURIComponent(safe)}`;
}

/** @deprecated Prefer marketingEditionPath */
export function editionShopHref(slug: string): string {
  return marketingEditionPath(slug);
}

export function resolveEditionShopLink(edition: MarketingEdition): string {
  const link = String(edition.shopLink || "").trim();
  if (link.startsWith("/")) {
    if (link.includes("edition=")) return marketingEditionPath(edition.slug);
    return link;
  }
  return marketingEditionPath(edition.slug);
}

export function isMarketingEditionIndexable(
  edition: Pick<MarketingEdition, "indexable">,
): boolean {
  return edition.indexable !== false;
}

const productTagSet = (product: Pick<Product, "tags">): Set<string> => {
  const set = new Set<string>();
  const rawTags = product.tags;
  const list = Array.isArray(rawTags) ? rawTags : [];
  for (const t of list) {
    const s = String(t || "").trim();
    if (!s) continue;
    const parts =
      s.includes(",") || s.includes("|") ? s.split(/[,|]/) : [s];
    for (const part of parts) {
      const key = normalizeMarketingEditionSlug(part);
      if (key) set.add(key);
    }
  }
  return set;
};

/** Match a single product tag string to a live marketing edition slug. */
export function marketingEditionForTag(
  tag: string,
  editions: MarketingEdition[] | null | undefined,
): MarketingEdition | null {
  const slug = normalizeMarketingEditionSlug(tag);
  if (!slug) return null;
  for (const edition of listLiveMarketingEditions(editions)) {
    if (edition.slug === slug) return edition;
  }
  return null;
}

/** Highest-priority card badge for a product (lowest sortOrder wins). */
export function resolveProductMarketingEdition(
  product: Pick<Product, "tags">,
  editions: MarketingEdition[] | null | undefined,
): MarketingEdition | null {
  const live = listLiveMarketingEditions(editions).filter((e) => e.showOnCard);
  if (!live.length) return null;
  const tags = productTagSet(product);
  if (!tags.size) return null;
  for (const edition of live) {
    if (tags.has(edition.slug)) return edition;
  }
  return null;
}

export function filterEditionsForShopSidebar(
  editions: MarketingEdition[] | null | undefined,
): MarketingEdition[] {
  return listLiveMarketingEditions(editions).filter((e) => e.showInFilter);
}

export function exploreHouseCardsFromEditions(
  editions: MarketingEdition[] | null | undefined,
): Array<{
  id: string;
  name: string;
  subtitle: string;
  href: string;
  image: string;
}> {
  const fallbackImage =
    "https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?w=600&q=85";
  return listLiveMarketingEditions(editions)
    .filter((e) => e.showInExploreHouse)
    .map((e) => ({
      id: `edition-${e.slug}`,
      name: e.exploreName || e.label,
      subtitle: (e.exploreSubtitle || "THE EDIT").toUpperCase(),
      href: resolveEditionShopLink(e),
      image: String(e.exploreImage || "").trim() || fallbackImage,
    }));
}

export const MARKETING_EDITION_ACCENT_CLASS: Record<
  NonNullable<MarketingEdition["accent"]>,
  string
> = {
  gold: "bg-[#1a1a1a]/88 text-[#f0dfa8] ring-1 ring-[#c5a059]/50",
  rose: "bg-rose-950/85 text-rose-50 ring-1 ring-rose-300/40",
  festive: "bg-gradient-to-r from-[#7c2d12] to-[#b45309] text-amber-50 ring-1 ring-amber-200/35",
  emerald: "bg-emerald-950/88 text-emerald-50 ring-1 ring-emerald-300/35",
  ink: "bg-navy-900/90 text-white ring-1 ring-white/15",
};
