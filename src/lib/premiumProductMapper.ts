import type { Product } from "@/types";
import type {
  PremiumEditorialPanel,
  PremiumProduct,
} from "@/lib/premiumCollectionData";

function urlsMatch(a: string, b: string): boolean {
  const na = a.trim().split("?")[0] ?? "";
  const nb = b.trim().split("?")[0] ?? "";
  if (!na || !nb) return false;
  return na === nb;
}

export type PremiumProductView = PremiumProduct & {
  _id: string;
  /** First gallery image for cards/listings (not premium hero). */
  cardImage: string;
  /** Catalog `Product.slug` - used for view counting & cart identity. */
  catalogSlug: string;
  variants: Product["variants"];
  totalStock: number;
  isActive: boolean;
  effectivePrice?: number;
  comparePrice?: number;
  discountPercent?: number;
  saleCampaignId?: string | null;
  saleBadge?: string | null;
  category?: string;
  subcategory?: string;
  shortDescription?: string;
  careInstructions?: string;
  highlights?: string[];
  productDetails?: Product["productDetails"];
  occasions?: string[];
  motionVideoUrl?: string;
  motionReelUrl?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  ratings?: Product["ratings"];
  isCustomizable?: boolean;
  isGiftable?: boolean;
  minOrderQty?: number;
  customFields?: Product["customFields"];
};

/** Grid/collection cards — always first catalog gallery shot, never premium hero. */
export function getPremiumCardImage(
  p: Pick<PremiumProductView, "cardImage" | "images">,
): string {
  return p.cardImage?.trim() || p.images[0]?.trim() || "";
}

function defaultEditorialOpen(p: Product): PremiumEditorialPanel {
  return {
    fields: [
      { label: "Body", value: p.fabric || "Premium silk" },
      {
        label: "Weave",
        value: p.weaveHours ? `${p.weaveHours}+ hours handloom` : "Handloom",
      },
    ],
    note:
      p.craftNote ||
      p.shortDescription ||
      (p.description ?? "").slice(0, 180),
  };
}

function defaultEditorialClose(p: Product): PremiumEditorialPanel {
  return {
    title: "The drape",
    fields: [
      { label: "Craft", value: p.fabric || "Handloom" },
      {
        label: "Hours",
        value:
          p.weaveHours ? `${p.weaveHours}+ hours handloom` : "Artisan woven",
      },
    ],
    note: (p.description ?? "").slice(0, 220),
  };
}

export function getPremiumRouteSlug(p: Product): string {
  return (p.premiumSlug || p.slug || "").trim();
}

export function mapApiProductToPremiumView(p: Product): PremiumProductView {
  const rawGallery = (p.images ?? []).map((img) => img.url).filter(Boolean);
  const heroImage = (p.premiumHeroImage?.url ?? "").trim();
  const galleryImages =
    heroImage ?
      rawGallery.filter((url) => !urlsMatch(url, heroImage))
    : rawGallery;
  const images = galleryImages.length > 0 ? galleryImages : rawGallery;
  const cardImage = images[0]?.trim() || "";

  return {
    _id: p._id,
    catalogSlug: (p.slug || "").trim(),
    slug: getPremiumRouteSlug(p),
    name: p.name,
    subtitle: p.premiumSubtitle || p.shortDescription || p.fabric || "Premium",
    fabric: p.fabric || "",
    price: p.effectivePrice ?? p.price,
    comparePrice: p.comparePrice,
    discountPercent: p.discountPercent,
    saleCampaignId: p.saleCampaignId,
    saleBadge: p.saleBadge,
    heroImage,
    cardImage,
    images,
    description: p.description ?? "",
    shortDescription: p.shortDescription,
    category: p.category,
    subcategory: p.subcategory,
    careInstructions: p.careInstructions,
    highlights: p.highlights,
    productDetails: p.productDetails,
    occasions: p.occasions,
    motionVideoUrl: p.motionVideoUrl,
    motionReelUrl: p.motionReelUrl,
    tags: p.tags,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    ratings: p.ratings,
    craftNote: p.craftNote || p.shortDescription || "",
    weaveHours: p.weaveHours ?? 0,
    editorialOpen: p.premiumEditorialOpen ?? defaultEditorialOpen(p),
    editorialClose: p.premiumEditorialClose ?? defaultEditorialClose(p),
    variants: p.variants ?? [],
    totalStock: p.totalStock ?? 0,
    isActive: p.isActive !== false,
    effectivePrice: p.effectivePrice,
    isCustomizable: p.isCustomizable,
    isGiftable: p.isGiftable,
    minOrderQty: p.minOrderQty,
    customFields: p.customFields,
  };
}

export function mapApiProductsToPremiumViews(
  products: Product[],
): PremiumProductView[] {
  return products
    .filter((p) => p.isPremium !== false)
    .map(mapApiProductToPremiumView)
    .filter((p) => p.slug && p.catalogSlug);
}
