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
      "Shop premium sarees online at The House of Rani — designer weaves, festive & bridal styles, free delivery over ₹1,099, and 5-day returns across India.",
    keywords: [
      "sarees online India",
      "buy sarees online",
      "premium sarees",
      "designer sarees India",
      "online saree shopping",
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
      "Festive sarees for Diwali, weddings, and celebrations. Curated ethnic wear with fast dispatch and easy 5-day returns.",
    keywords: ["festive sarees India", "party wear sarees", "celebration sarees online"],
  },
  "salwar-suits": {
    title: "Salwar Suits & Ethnic Sets Online India",
    description:
      "Shop salwar suits, ethnic co-ord sets, and women’s Indian wear online at The House of Rani. Premium fabrics, festive styles, free delivery over ₹1,099, and 5-day returns.",
    keywords: [
      "salwar suits online India",
      "buy salwar suits online",
      "designer salwar suits",
      "women salwar kameez online",
      "ethnic suits online",
      "punjabi suits online",
      "festive salwar suits",
    ],
  },
  lehengas: {
    title: "Lehengas & Ethnic Occasion Wear Online India",
    description:
      "Occasion-ready lehengas and ethnic silhouettes for weddings and festivities. Shop curated styles at The House of Rani with pan-India delivery.",
    keywords: ["lehenga online India", "wedding lehenga online", "bridal lehenga", "festive lehenga sets"],
  },
  corsets: {
    title: "Corsets & Ethnic Tops Online India",
    description:
      "Structured corsets and ethnic tops to pair with sarees and lehengas. Premium fits with easy returns from The House of Rani.",
    keywords: ["corset tops online India", "ethnic corsets", "saree blouse corset", "women ethnic tops"],
  },
  lehenga: {
    title: "Chaniya Choli & Lehenga Choli Sets Online India",
    description:
      "Shop chaniya choli and lehenga choli sets for Navratri, weddings, and festive celebrations. Curated occasion wear from The House of Rani with pan-India delivery.",
    keywords: ["chaniya choli online", "lehenga choli sets India", "festive lehenga online", "Navratri lehenga"],
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
  // Exact / whole-word-ish matches only — never map every "*saree*" slug to the generic sarees preset
  // (that caused identical titles for Chanderi, Chiffon, Jamdani, etc. in Bing).
  if (normalized === "sarees" || normalized === "saree") return "sarees";
  if (name.includes("silk") && !name.includes("cotton")) return "silk";
  if (name.includes("cotton")) return "cotton";
  if (name.includes("bridal") || name.includes("wedding")) return "bridal";
  if (name.includes("kalamkari") || name.includes("handpaint")) return "kalamkari";
  if (name.includes("festive") || name.includes("party")) return "festive";
  if (name.includes("salwar")) return "salwar-suits";
  if (name.includes("corset")) return "corsets";
  if (name.includes("lehenga") || name.includes("chaniya")) return "lehengas";
  if (name.includes("gift")) return "gifts";
  return normalized;
}

export function resolveCategoryPageSeo(categoryName: string, slug: string): CategorySeoPreset {
  const key = matchPresetSlug(categoryName, slug);
  const preset = CATEGORY_PRESETS[key];
  if (preset) return preset;

  const name = categoryName.trim() || "Ethnic Wear";
  const isSareeLike = /saree|sari/i.test(name);
  return {
    title: isSareeLike
      ? `Buy ${name} Online India`
      : `Shop ${name} Online India`,
    description: `Shop ${name} at The House of Rani — premium Indian ethnic wear with pan-India delivery, free shipping over ₹1,099, and easy 5-day returns.`,
    keywords: [
      `${name} online India`,
      `buy ${name} online`,
      `${name} The House of Rani`,
      "Indian ethnic wear online",
    ],
  };
}
