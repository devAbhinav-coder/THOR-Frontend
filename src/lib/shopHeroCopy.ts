import { resolveCategoryPageSeo } from "@/lib/categoryPageSeo";
import { SHOP_META_TITLE } from "@/lib/brandSeo";

export type ShopHeroContent = {
  /** Visible on hero — short brand line */
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  /** Full string for accessibility / SEO in one h1 */
  h1Accessible: string;
  perks: readonly string[];
};

const DEFAULT_PERKS = [
  "Free delivery over ₹1,099",
  "5-day easy returns",
  "Pan-India shipping",
] as const;

export function resolveShopHeroContent(options: {
  categoryName?: string | null;
  categoryDescription?: string | null;
  search?: string | null;
  color?: string | null;
  isFeatured?: string | null;
  onSale?: string | null;
  bannerTitle?: string | null;
}): ShopHeroContent {
  const search = String(options.search || "").trim();
  if (search) {
    const short = search.length > 36 ? `${search.slice(0, 36)}…` : search;
    return {
      eyebrow: "Search our boutique",
      titleLine1: "Results for",
      titleLine2: `"${short}"`,
      subtitle:
        "Refine with fabric, price, and rating filters — premium sarees, salwar suits & corsets delivered across India.",
      h1Accessible: `Search results for ${search} — sarees, salwar suits & corsets`,
      perks: DEFAULT_PERKS,
    };
  }

  const category = String(options.categoryName || "").trim();
  if (category) {
    const custom = String(options.categoryDescription || "").trim();
    return {
      eyebrow: `${category} · Curated collection`,
      titleLine1: "Drape elegance in",
      titleLine2: category,
      subtitle:
        custom && custom.length <= 140 ?
          custom
        : `Handpicked ${category} — artisan details, celebration-ready styles, and trusted delivery across India.`,
      h1Accessible: resolveCategoryPageSeo(category, category).title,
      perks: DEFAULT_PERKS,
    };
  }

  const color = String(options.color || "").trim();
  if (color) {
    return {
      eyebrow: `${color} edit`,
      titleLine1: "Shop",
      titleLine2: `${color} styles`,
      subtitle: `Explore ${color} sarees, salwar suits & corsets for weddings, festivities, and elevated everyday moments.`,
      h1Accessible: `${color} sarees, salwar suits & corsets online India`,
      perks: DEFAULT_PERKS,
    };
  }

  if (options.isFeatured === "true") {
    return {
      eyebrow: "Editor's picks · Limited styles",
      titleLine1: "Featured styles",
      titleLine2: "our clients love",
      subtitle:
        "A rotating selection of bestsellers and new arrivals — premium sarees, salwar suits, and corsets ready to ship.",
      h1Accessible:
        "Featured premium sarees, salwar suits, and corsets online India",
      perks: DEFAULT_PERKS,
    };
  }

  if (options.onSale === "true") {
    return {
      eyebrow: "Limited-time savings",
      titleLine1: "Sale styles",
      titleLine2: "& ethnic wear",
      subtitle:
        "Handpicked sarees, salwar suits, and corsets with special pricing — celebration-ready looks at reduced rates.",
      h1Accessible: "Sale sarees, salwar suits, and corsets online India",
      perks: DEFAULT_PERKS,
    };
  }

  const banner = String(options.bannerTitle || "").trim();
  const genericBanners = new Set([
    "shop our collection",
    "shop premium sarees & ethnic wear online india",
    "shop sarees, salwar suits & corsets online india",
    "shop collection",
  ]);
  if (banner && !genericBanners.has(banner.toLowerCase())) {
    return {
      eyebrow: "The House of Rani",
      titleLine1: banner,
      titleLine2: "collection",
      subtitle:
        "Premium Indian ethnic wear — sarees, salwar suits & corsets delivered with care across India.",
      h1Accessible: banner,
      perks: DEFAULT_PERKS,
    };
  }

  return {
    eyebrow: "India's ethnic atelier · Crafted with heritage",
    titleLine1: "Sarees, suits & corsets",
    titleLine2: "for every celebration",
    subtitle:
      "Discover designer silk, cotton, and festive drapes with story-led motifs — free delivery over ₹1,099 & hassle-free 5-day returns.",
    h1Accessible: SHOP_META_TITLE,
    perks: DEFAULT_PERKS,
  };
}
