/**
 * Central brand + SERP copy for The House of Rani.
 * Primary positioning: premium Indian ethnic wear (sarees, salwar suits, corsets).
 * Gifting is secondary — keep on /gifting, not homepage snippets.
 */
export const BRAND_NAME = "The House of Rani";
export const BRAND_SHORT = "House of Rani";

/** Homepage SERP title (absolute — includes brand once). */
export const HOME_TITLE =
  "Premium Sarees, Salwar Suits & Corsets | The House of Rani";

/** Meta description — keep ≤155 chars for full SERP display. */
export const HOME_META_DESCRIPTION =
  "Shop premium sarees, salwar suits & corsets at The House of Rani. Festive & bridal styles, free delivery over ₹1,099, easy 5-day returns across India.";

export const ROOT_DEFAULT_TITLE =
  "The House of Rani | Premium Sarees, Salwar Suits & Corsets Online";

export const ROOT_DEFAULT_DESCRIPTION = HOME_META_DESCRIPTION;

export const ORG_SCHEMA_DESCRIPTION =
  "Premium sarees, salwar suits & corsets for weddings and everyday elegance, plus handmade and corporate gifting. Pan-India delivery from The House of Rani.";

export const HOME_OG_TITLE = HOME_TITLE;

export const HOME_OG_DESCRIPTION =
  "Discover exquisite sarees, salwar suits & corsets — heritage craftsmanship with modern elegance. Free delivery over ₹1,099.";

/** Visible copy for home gifting block — secondary; wrap with data-nosnippet in UI when possible. */
export const HOME_GIFT_SHOWCASE_DESCRIPTION =
  "Explore handmade gifts, corporate gifting, and curated hampers designed to complement our ethnic wear collections.";

export const FOOTER_DEFAULT_DESCRIPTION =
  "Discover premium Indian ethnic wear including sarees, salwar suits, and corsets — crafted with elegance, tradition, and timeless design.";

/** Shop listing SERP title segment — root template appends `| The House of Rani`. */
export const SHOP_META_TITLE =
  "Shop Sarees, Salwar Suits & Corsets Online India";
export const SHOP_META_DESCRIPTION =
  "Shop premium sarees, salwar suits & corsets at The House of Rani. Filter by fabric, price & rating. Free delivery over ₹1,099.";

export const SHOP_KEYWORDS = [
  "sarees online India",
  "salwar suits online India",
  "corsets online India",
  "buy sarees online India",
  "buy salwar suits online",
  "ethnic corsets online",
  "designer salwar suits",
  "premium sarees India",
  "women ethnic wear online",
  "The House of Rani",
  "ethnic wear online India",
] as const;

/** Official brand profiles for Organization / LocalBusiness sameAs. */
export const BRAND_SAME_AS = [
  "https://www.instagram.com/housofrani",
  "https://www.facebook.com/people/HouseofRani/61580570102572/",
] as const;

/** Primary homepage keywords — gifting terms live on /gifting metadata only. */
export const HOME_KEYWORDS = [
  "sarees online India",
  "buy sarees online",
  "premium sarees",
  "designer sarees India",
  "bridal sarees online",
  "wedding sarees online",
  "party wear sarees",
  "salwar suits online India",
  "buy salwar suits online",
  "designer salwar suits",
  "corsets online India",
  "ethnic corsets",
  "saree blouse corset",
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
  "handloom sarees",
  "corporate gifting India",
  "handmade gifts India",
  "wedding saree gifts",
] as const;
