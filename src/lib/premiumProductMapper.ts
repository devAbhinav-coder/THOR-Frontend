import type { Product } from "@/types";
import type {
  PremiumEditorialPanel,
  PremiumProduct,
} from "@/lib/premiumCollectionData";

export type PremiumProductView = PremiumProduct & {
  _id: string;
  variants: Product["variants"];
  totalStock: number;
  isActive: boolean;
  effectivePrice?: number;
};

function defaultEditorialOpen(p: Product): PremiumEditorialPanel {
  return {
    fields: [
      { label: "Body", value: p.fabric || "Premium silk" },
      {
        label: "Weave",
        value: p.weaveHours ? `${p.weaveHours}+ hours handloom` : "Handloom",
      },
    ],
    note: p.craftNote || p.shortDescription || p.description.slice(0, 180),
  };
}

function defaultEditorialClose(p: Product): PremiumEditorialPanel {
  return {
    title: "The drape",
    fields: [
      { label: "Craft", value: p.fabric || "Handloom" },
      {
        label: "Hours",
        value: p.weaveHours ? `${p.weaveHours}+ hours handloom` : "Artisan woven",
      },
    ],
    note: p.description.slice(0, 220),
  };
}

export function getPremiumRouteSlug(p: Product): string {
  return (p.premiumSlug || p.slug || "").trim();
}

export function mapApiProductToPremiumView(p: Product): PremiumProductView {
  const imageUrls = (p.images ?? []).map((img) => img.url).filter(Boolean);
  const heroImage = p.premiumHeroImage?.url || imageUrls[0] || "";

  return {
    _id: p._id,
    slug: getPremiumRouteSlug(p),
    name: p.name,
    subtitle: p.premiumSubtitle || p.shortDescription || p.fabric || "Premium",
    fabric: p.fabric || "",
    price: p.effectivePrice ?? p.price,
    heroImage,
    images: imageUrls.length > 0 ? imageUrls : heroImage ? [heroImage] : [],
    description: p.description,
    craftNote: p.craftNote || p.shortDescription || "",
    weaveHours: p.weaveHours ?? 0,
    editorialOpen: p.premiumEditorialOpen ?? defaultEditorialOpen(p),
    editorialClose: p.premiumEditorialClose ?? defaultEditorialClose(p),
    variants: p.variants ?? [],
    totalStock: p.totalStock ?? 0,
    isActive: p.isActive !== false,
    effectivePrice: p.effectivePrice,
  };
}

export function mapApiProductsToPremiumViews(
  products: Product[],
): PremiumProductView[] {
  return products
    .filter((p) => p.isPremium !== false)
    .map(mapApiProductToPremiumView)
    .filter((p) => p.slug);
}
