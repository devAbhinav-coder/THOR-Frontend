import type { Category, HomeExploreHouse } from "@/types";
import {
  PREMIUM_COLLECTION_CARD,
  PREMIUM_COLLECTION_HREF,
  PREMIUM_HERO_IMAGE,
} from "@/lib/premiumCollectionData";

export const SHOP_SALE_HREF = "/shop/collections?onSale=true";
export const PREMIUM_HREF = PREMIUM_COLLECTION_HREF;
/** @deprecated Use PREMIUM_HREF — gifting removed from storefront nav */
export const GIFTING_HREF = PREMIUM_COLLECTION_HREF;

export const SHOP_SALE_CARD = {
  id: "shop-sale",
  name: "Sale",
  subtitle: "ON OFFER",
  href: SHOP_SALE_HREF,
  image:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=85",
} as const;

export const SHOP_PREMIUM_CARD = PREMIUM_COLLECTION_CARD;

/** @deprecated Use SHOP_PREMIUM_CARD */
export const SHOP_GIFTING_CARD = SHOP_PREMIUM_CARD;

export function resolveSaleCardImage(
  exploreHouse?: Pick<HomeExploreHouse, "saleImage"> | null,
): string {
  const admin = String(exploreHouse?.saleImage || "").trim();
  return admin || SHOP_SALE_CARD.image;
}

export function resolveSaleCard(
  exploreHouse?: Pick<HomeExploreHouse, "saleImage" | "saleName" | "saleSubtitle"> | null,
) {
  const name = String(exploreHouse?.saleName || "").trim() || SHOP_SALE_CARD.name;
  const subtitle =
    String(exploreHouse?.saleSubtitle || "").trim() || SHOP_SALE_CARD.subtitle;
  return {
    ...SHOP_SALE_CARD,
    name,
    subtitle,
    image: resolveSaleCardImage(exploreHouse),
  };
}

export function resolvePremiumCardImage(
  exploreHouse?: Pick<HomeExploreHouse, "giftingImage"> | null,
): string {
  const admin = String(exploreHouse?.giftingImage || "").trim();
  return admin || PREMIUM_HERO_IMAGE;
}

export function resolvePremiumCard(
  exploreHouse?: Pick<
    HomeExploreHouse,
    "giftingImage" | "giftingName" | "giftingSubtitle"
  > | null,
) {
  const name =
    String(exploreHouse?.giftingName || "").trim() || SHOP_PREMIUM_CARD.name;
  const subtitle =
    String(exploreHouse?.giftingSubtitle || "").trim() ||
    SHOP_PREMIUM_CARD.subtitle;
  return {
    ...SHOP_PREMIUM_CARD,
    name: /gift/i.test(name) ? SHOP_PREMIUM_CARD.name : name,
    subtitle: /gift/i.test(subtitle) ? SHOP_PREMIUM_CARD.subtitle : subtitle,
    image: resolvePremiumCardImage(exploreHouse),
  };
}

/** @deprecated Use resolvePremiumCard */
export function resolveGiftingCard(
  _categories?: Array<Pick<Category, "image" | "name" | "slug" | "isGiftCategory">>,
  exploreHouse?: Pick<
    HomeExploreHouse,
    "giftingImage" | "giftingName" | "giftingSubtitle"
  > | null,
) {
  return resolvePremiumCard(exploreHouse);
}

/** @deprecated Use resolvePremiumCardImage */
export const resolveGiftingCardImage = (
  _categories?: Array<Pick<Category, "image" | "name" | "slug" | "isGiftCategory">>,
  exploreHouse?: Pick<HomeExploreHouse, "giftingImage"> | null,
) => resolvePremiumCardImage(exploreHouse);
