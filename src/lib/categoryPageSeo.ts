import { toShopCategorySlug } from "@/lib/shopCategorySeo";

type CategorySeoPreset = {
  title: string;
  description: string;
  keywords: string[];
};

/**
 * India-first category SERP copy — slug keys from /shop/category/[slug].
 * Unknown categories fall back to dynamic templates with saree-intent keywords.
 */
const CATEGORY_PRESETS: Record<string, CategorySeoPreset> = {
  sarees: {
    title: "Premium Sarees Collection — Shop Online India",
    description:
      "Shop premium sarees online at The House of Rani — designer weaves, festive & bridal styles, free delivery over ₹1,099, and 7-day returns across India.",
    keywords: [
      "sarees online India",
      "buy sarees online",
      "premium sarees",
      "designer sarees India",
      "online saree shopping",
      ""
    ],
  },
  silk: {
    title: "Silk Sarees Online India",
    description:
      "Browse silk sarees at The House of Rani — rich weaves for weddings, festivals, and celebrations. Pan-India delivery, easy returns, secure checkout.",
    keywords: ["silk sarees online", "pure silk saree India", "wedding silk sarees", "festive silk sarees"],
  },
  cotton: {
    title: "Cotton Sarees Online India",
    description:
      "Lightweight cotton sarees for everyday and festive wear. Breathable fabrics, artisan prints, and trusted delivery from The House of Rani.",
    keywords: ["cotton sarees online", "handloom cotton saree", "daily wear sarees India"],
  },
  bridal: {
    title: "Bridal Sarees Online India",
    description:
      "Bridal sarees and wedding-ready drapes curated for your big day. Premium craftsmanship, pan-India shipping, and hassle-free returns.",
    keywords: ["bridal sarees online", "wedding sarees India", "bridal ethnic wear online"],
  },
  kalamkari: {
    title: "Kalamkari Sarees Online India",
    description:
      "Hand-painted Kalamkari sarees with story-led motifs. Shop artisan ethnic wear with free delivery over ₹1,099 at The House of Rani.",
    keywords: ["kalamkari sarees online", "handpainted sarees India", "artisan sarees"],
  },
  festive: {
    title: "Festive Sarees Online India",
    description:
      "Festive sarees for Diwali, weddings, and celebrations. Curated ethnic wear with fast dispatch and easy 7-day returns.",
    keywords: ["festive sarees India", "party wear sarees", "celebration sarees online"],
  },
  "salwar-suits": {
    title: "Salwar Suits & Ethnic Sets Online India",
    description:
      "Salwar suits and coordinated ethnic sets for everyday and occasion wear. Premium fabrics and pan-India delivery.",
    keywords: ["salwar suits online India", "ethnic suits online", "women ethnic wear"],
  },
  lehenga: {
    title: "Lehengas & Ethnic Occasion Wear Online",
    description:
      "Occasion-ready lehengas and ethnic silhouettes for weddings and festivities. Shop curated styles at The House of Rani.",
    keywords: ["lehenga online India", "ethnic occasion wear", "wedding lehenga online"],
  },
  gifts: {
    title: "Saree Gift Sets & Ethnic Gift Hampers India",
    description:
      "Thoughtful saree gift sets and ethnic hampers for weddings, festivals, and corporate gifting. Customizable options with India-wide shipping.",
    keywords: ["saree gift sets India", "ethnic gift hampers", "wedding sarees"],
  },
};

function matchPresetSlug(categoryName: string, slug: string): string {
  const normalized = toShopCategorySlug(slug || categoryName);
  if (CATEGORY_PRESETS[normalized]) return normalized;
  const name = categoryName.toLowerCase();
  if (name.includes("silk")) return "silk";
  if (name.includes("cotton")) return "cotton";
  if (name.includes("bridal") || name.includes("wedding")) return "bridal";
  if (name.includes("kalamkari") || name.includes("handpaint")) return "kalamkari";
  if (name.includes("festive") || name.includes("party")) return "festive";
  if (name.includes("salwar")) return "salwar-suits";
  if (name.includes("lehenga")) return "lehenga";
  if (name.includes("gift")) return "gifts";
  if (name.includes("saree")) return "sarees";
  return normalized;
}

export function resolveCategoryPageSeo(categoryName: string, slug: string): CategorySeoPreset {
  const key = matchPresetSlug(categoryName, slug);
  const preset = CATEGORY_PRESETS[key];
  if (preset) return preset;

  const name = categoryName.trim() || "Ethnic Wear";
  return {
    title: `${name} Sarees & Ethnic Wear Online India`,
    description: `Shop ${name} at The House of Rani — premium Indian ethnic wear with pan-India delivery, free shipping over ₹1,099, and easy 7-day returns.`,
    keywords: [
      `${name} sarees online`,
      `${name} ethnic wear India`,
      `buy ${name} sarees online`,
      "The House of Rani",
      "Indian ethnic wear online",
    ],
  };
}
