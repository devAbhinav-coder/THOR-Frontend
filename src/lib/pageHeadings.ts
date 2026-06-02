import { resolveCategoryPageSeo } from "@/lib/categoryPageSeo";

/** Visible H1 defaults — align with meta titles in brandSeo / page metadata. */
export const HOME_H1 = "Buy Premium Sarees Online in India";
export const SHOP_H1_DEFAULT = "Shop Premium Sarees & Ethnic Wear Online India";
export const GIFTING_H1_DEFAULT = "Saree Gift Sets & Ethnic Gift Hampers Online India";
export const BLOG_H1 = "Saree Styling & Ethnic Wear Journal";
export const FAQ_H1 = "Saree Shopping FAQ — Orders, Shipping & Returns";

const GENERIC_HOME_SLIDE_TITLES = new Set(
  [
    "elegance in every thread",
    "discover the art of ethnic",
    "new silk saree collection",
    "shop our collection",
  ].map((s) => s.toLowerCase()),
);

const GENERIC_SHOP_BANNER_TITLES = new Set(
  ["shop our collection", "shop collection", "all sarees"].map((s) => s.toLowerCase()),
);

const GENERIC_GIFTING_TITLES = new Set(
  ["smart gifting made easy", "gifting collection", "curated gifts"].map((s) =>
    s.toLowerCase(),
  ),
);

export function resolveHomeHeroH1(slideTitle?: string | null): string {
  const t = String(slideTitle || "").trim();
  if (!t || GENERIC_HOME_SLIDE_TITLES.has(t.toLowerCase())) return HOME_H1;
  if (!/\bsaree|ethnic|bridal|silk|cotton|wear\b/i.test(t)) {
    return `${t} — Premium Sarees Online India`;
  }
  return t;
}

/** Visible hero headline — admin slide title as-is (no SEO suffix stacking). */
export function getHeroSlideDisplayTitle(slideTitle?: string | null): string {
  const t = String(slideTitle || "").trim();
  if (!t || GENERIC_HOME_SLIDE_TITLES.has(t.toLowerCase())) return HOME_H1;
  return t;
}

export function resolveShopBannerH1(options: {
  categoryName?: string | null;
  search?: string | null;
  fabric?: string | null;
  isFeatured?: string | null;
  bannerTitle?: string | null;
}): string {
  const search = String(options.search || "").trim();
  if (search) {
    const short = search.length > 40 ? `${search.slice(0, 40)}…` : search;
    return `Search: ${short}`;
  }
  const category = String(options.categoryName || "").trim();
  if (category) {
    return resolveCategoryPageSeo(category, category).title;
  }
  const fabric = String(options.fabric || "").trim();
  if (fabric) return `${fabric} Sarees Online India`;
  if (options.isFeatured === "true") return "Featured Sarees & Ethnic Wear Online India";
  const banner = String(options.bannerTitle || "").trim();
  if (banner && !GENERIC_SHOP_BANNER_TITLES.has(banner.toLowerCase())) return banner;
  return SHOP_H1_DEFAULT;
}

export function resolveShopListHeading(options: {
  categoryName?: string | null;
  search?: string | null;
  fabric?: string | null;
  isFeatured?: string | null;
}): string {
  const search = String(options.search || "").trim();
  if (search) {
    const short = search.length > 32 ? `${search.slice(0, 32)}…` : search;
    return `Results for “${short}”`;
  }
  const category = String(options.categoryName || "").trim();
  if (category) return `${category} Collection`;
  const fabric = String(options.fabric || "").trim();
  if (fabric) return `${fabric} Sarees`;
  if (options.isFeatured === "true") return "Featured Sarees";
  return "All Sarees";
}

export function resolveGiftingHeroH1(heroTitle?: string | null): string {
  const t = String(heroTitle || "").trim();
  if (!t || GENERIC_GIFTING_TITLES.has(t.toLowerCase())) return GIFTING_H1_DEFAULT;
  if (!/\bgift|saree|hamper|ethnic\b/i.test(t)) {
    return `${t} — Saree & Ethnic Gifts India`;
  }
  return t;
}
