import { resolveCategoryPageSeo } from "@/lib/categoryPageSeo";

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
  fabric?: string | null;
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
        "Refine with fabric, price, and rating filters — premium sarees & ethnic wear delivered across India.",
      h1Accessible: `Search results for ${search} — sarees & ethnic wear`,
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
        : `Handpicked ${category} sarees & ethnic wear — artisan weaves, celebration-ready styles, and trusted delivery across India.`,
      h1Accessible: resolveCategoryPageSeo(category, category).title,
      perks: DEFAULT_PERKS,
    };
  }

  const fabric = String(options.fabric || "").trim();
  if (fabric) {
    return {
      eyebrow: `${fabric} edit`,
      titleLine1: "Shop",
      titleLine2: `${fabric} sarees`,
      subtitle:
        `Explore ${fabric} weaves styled for weddings, festivities, and elevated everyday moments — only at The House of Rani.`,
      h1Accessible: `${fabric} sarees online India`,
      perks: DEFAULT_PERKS,
    };
  }

  if (options.isFeatured === "true") {
    return {
      eyebrow: "Editor's picks · Limited styles",
      titleLine1: "Featured sarees",
      titleLine2: "our clients love",
      subtitle:
        "A rotating selection of bestsellers and new arrivals — premium fabrics, statement drapes, ready to ship.",
      h1Accessible: "Featured premium sarees and ethnic wear online India",
      perks: DEFAULT_PERKS,
    };
  }

  if (options.onSale === "true") {
    return {
      eyebrow: "Limited-time savings",
      titleLine1: "Sale sarees",
      titleLine2: "& ethnic wear",
      subtitle:
        "Handpicked styles with special pricing — premium weaves and celebration-ready drapes at reduced rates.",
      h1Accessible: "Sale sarees and ethnic wear online India",
      perks: DEFAULT_PERKS,
    };
  }

  const banner = String(options.bannerTitle || "").trim();
  const genericBanners = new Set([
    "shop our collection",
    "shop premium sarees & ethnic wear online india",
    "shop collection",
  ]);
  if (banner && !genericBanners.has(banner.toLowerCase())) {
    return {
      eyebrow: "The House of Rani",
      titleLine1: banner,
      titleLine2: "collection",
      subtitle:
        "Premium Indian ethnic wear — handcrafted details, modern silhouettes, delivered with care across India.",
      h1Accessible: banner,
      perks: DEFAULT_PERKS,
    };
  }

  return {
    eyebrow: "India's ethnic atelier · Crafted with heritage",
    titleLine1: "Sarees woven for",
    titleLine2: "every celebration",
    subtitle:
      "Discover designer silk, cotton, and festive drapes with story-led motifs — free delivery over ₹1,099 & hassle-free 5-day returns.",
    h1Accessible:
      "Premium sarees and Indian ethnic wear — shop online at The House of Rani",
    perks: DEFAULT_PERKS,
  };
}
