/**
 * Central brand + SERP copy for The House of Rani.
 * Primary positioning: premium Indian ethnic wear (sarees first).
 * Gifting is secondary — keep on /gifting, not homepage snippets.
 */
export const BRAND_NAME = "The House of Rani";
export const BRAND_SHORT = "House of Rani";

/** Homepage SERP title (absolute — includes brand once). */
export const HOME_TITLE =
  "Buy Premium Sarees Online in India | Ethnic Wear — The House of Rani";

/** Meta description — matches what we want in Google blue link text. */
export const HOME_META_DESCRIPTION =
  "Shop premium sarees and Indian ethnic wear at The House of Rani. Designer weaves, festive & bridal styles, free delivery over ₹1,099, and easy 7-day returns across India.";

export const ROOT_DEFAULT_TITLE =
  "The House of Rani | Premium Sarees & Indian Ethnic Wear Online";

export const ROOT_DEFAULT_DESCRIPTION = HOME_META_DESCRIPTION;

export const ORG_SCHEMA_DESCRIPTION =
  "Premium sarees and Indian ethnic wear curated for weddings, festivities, and timeless everyday elegance. Pan-India delivery from The House of Rani.";

export const HOME_OG_TITLE =
  "Premium Sarees & Indian Ethnic Wear | The House of Rani";

export const HOME_OG_DESCRIPTION =
  "Discover exquisite sarees and ethnic wear — heritage craftsmanship with modern elegance. Free delivery over ₹1,099.";

/** Visible copy for home gifting block — secondary; wrapped with data-nosnippet in UI. */
export const HOME_GIFT_SHOWCASE_DESCRIPTION =
  "Explore curated gift sets and celebration hampers designed to complement our saree collections for weddings and special occasions.";

export const FOOTER_DEFAULT_DESCRIPTION =
  "Discover premium Indian ethnic wear including sarees, salwar suits, and festive styles — crafted with elegance, tradition, and timeless design.";

export const SHOP_META_TITLE = "Shop Premium Sarees & Ethnic Wear Online India";
export const SHOP_META_DESCRIPTION =
  "Shop premium sarees, salwar suits, and ethnic wear at The House of Rani. Filter by category, fabric, price, and rating. Free delivery over ₹1,099.";

/** Primary homepage keywords — gifting terms live on /gifting metadata only. */
export const HOME_KEYWORDS = [
  "sarees online India",
  "buy sarees online",
  "premium sarees",
  "designer sarees India",
  "bridal sarees online",
  "wedding sarees online",
  "party wear sarees",
  "Indian ethnic wear online",
  "women ethnic wear online",
  "designer ethnic wear",
  "festive sarees India",
  "traditional sarees online",
  "online saree shopping",
  "The House of Rani",
  "House of Rani",

  // Fabric & style keywords
  "jamdani sarees",
  "silk sarees online",
  "cotton sarees online",
  "georgette sarees",
  "chiffon sarees",
  "crepe sarees",
  "net sarees",
  "organza sarees",
  "linen sarees",

  // Design keywords
  "handpainted sarees",
  "printed sarees",
  "block printed sarees",
  "digital printed sarees",
] as const;

export const ROOT_KEYWORDS = [
  ...HOME_KEYWORDS,
  "salwar suits online",
  "handloom sarees",
] as const;
