import { resolveCategoryPageSeo } from "@/lib/categoryPageSeo";

/** Visible H1 defaults — align with meta titles in brandSeo / page metadata. */
export const HOME_H1 =
  "Premium Sarees, Salwar Suits & Corsets Online in India";
export const SHOP_H1_DEFAULT =
  "Shop Sarees, Salwar Suits & Corsets Online India";
export const GIFTING_H1_DEFAULT =
  "Handmade Gifts, Corporate Gifting & Hampers Online India";
export const BLOG_H1 = "Saree Styling, Salwar Suits & Ethnic Wear Journal";
export const FAQ_H1 = "Shopping FAQ — Orders, Shipping & Returns";

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
  if (!/\bsaree|salwar|corset|ethnic|bridal|silk|cotton|wear\b/i.test(t)) {
    return `${t} — Premium Ethnic Wear Online India`;
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
  color?: string | null;
  isFeatured?: string | null;
  onSale?: string | null;
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
  const color = String(options.color || "").trim();
  if (color) return `${color} Styles Online India`;
  if (options.isFeatured === "true") return "Featured Sarees, Salwar Suits & Corsets Online India";
  if (options.onSale === "true") return "Sale Sarees, Salwar Suits & Corsets Online India";
  const banner = String(options.bannerTitle || "").trim();
  if (banner && !GENERIC_SHOP_BANNER_TITLES.has(banner.toLowerCase())) return banner;
  return SHOP_H1_DEFAULT;
}

export function resolveShopListHeading(options: {
  categoryName?: string | null;
  search?: string | null;
  color?: string | null;
  isFeatured?: string | null;
  onSale?: string | null;
}): string {
  const search = String(options.search || "").trim();
  if (search) {
    const short = search.length > 32 ? `${search.slice(0, 32)}…` : search;
    return `Results for “${short}”`;
  }
  const category = String(options.categoryName || "").trim();
  if (category) return `${category} Collection`;
  const color = String(options.color || "").trim();
  if (color) return `${color} Collection`;
  if (options.isFeatured === "true") return "Featured Picks";
  if (options.onSale === "true") return "Sale & Offers";
  return "All Collections";
}

export function resolveGiftingHeroH1(heroTitle?: string | null): string {
  const t = String(heroTitle || "").trim();
  if (!t || GENERIC_GIFTING_TITLES.has(t.toLowerCase())) return GIFTING_H1_DEFAULT;
  if (!/\bgift|handmade|hamper|corporate|pen|ethnic\b/i.test(t)) {
    return `${t} — Handmade & Corporate Gifts India`;
  }
  return t;
}
