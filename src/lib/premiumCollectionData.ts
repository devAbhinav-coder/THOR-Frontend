export type PremiumEditorialPanel = {
  /** Optional heading beside the editorial image */
  title?: string;
  fields: Array<{ label: string; value: string }>;
  note: string;
};

export type PremiumProduct = {
  slug: string;
  name: string;
  subtitle: string;
  fabric: string;
  price: number;
  heroImage: string;
  images: string[];
  description: string;
  craftNote: string;
  weaveHours: number;
  /** Text beside the first editorial image row */
  editorialOpen: PremiumEditorialPanel;
  /** Text beside the last editorial image row */
  editorialClose: PremiumEditorialPanel;
};

/** Decorative fallbacks when storefront CMS has no premium images yet. */
export const PREMIUM_HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85";

export const PREMIUM_EDITORIAL_IMAGE =
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1600&q=85";

export const PREMIUM_CRAFT_IMAGE =
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85";

export const PREMIUM_COLLECTION_HREF = "/premium";

export const PREMIUM_COLLECTION_CARD = {
  id: "premium-collection",
  name: "Premium",
  subtitle: "THE EDIT",
  href: PREMIUM_COLLECTION_HREF,
  image: PREMIUM_EDITORIAL_IMAGE,
} as const;
