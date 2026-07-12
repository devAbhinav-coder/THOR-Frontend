import type { Category, HomeExploreHouse } from "@/types";

export const SHOP_SALE_HREF = "/shop/collections?onSale=true";
export const GIFTING_HREF = "/gifting";

export const SHOP_SALE_CARD = {
  id: "shop-sale",
  name: "Sale",
  subtitle: "ON OFFER",
  href: SHOP_SALE_HREF,
  image:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=85",
} as const;

export const SHOP_GIFTING_CARD = {
  id: "shop-gifting",
  name: "Gifting",
  subtitle: "THE COLLECTION",
  href: GIFTING_HREF,
  image:
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=85",
} as const;

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

export function resolveGiftingCardImage(
  categories?: Array<Pick<Category, "image" | "name" | "slug" | "isGiftCategory">>,
  exploreHouse?: Pick<HomeExploreHouse, "giftingImage"> | null,
): string {
  const admin = String(exploreHouse?.giftingImage || "").trim();
  if (admin) return admin;
  const gifting = categories?.find(
    (c) =>
      c.isGiftCategory ||
      String(c.name || "").toLowerCase().includes("gift") ||
      String(c.slug || "").toLowerCase().includes("gift"),
  );
  return gifting?.image || SHOP_GIFTING_CARD.image;
}

export function resolveGiftingCard(
  categories?: Array<Pick<Category, "image" | "name" | "slug" | "isGiftCategory">>,
  exploreHouse?: Pick<
    HomeExploreHouse,
    "giftingImage" | "giftingName" | "giftingSubtitle"
  > | null,
) {
  const name =
    String(exploreHouse?.giftingName || "").trim() || SHOP_GIFTING_CARD.name;
  const subtitle =
    String(exploreHouse?.giftingSubtitle || "").trim() || SHOP_GIFTING_CARD.subtitle;
  return {
    ...SHOP_GIFTING_CARD,
    name,
    subtitle,
    image: resolveGiftingCardImage(categories, exploreHouse),
  };
}
