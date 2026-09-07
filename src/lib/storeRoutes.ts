/** `/shop/[slug]` product detail — not listing or collections routes. */
export function isStoreProductDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/shop/")) return false;
  if (pathname.startsWith("/shop/category")) return false;
  if (pathname.startsWith("/shop/collections")) return false;
  return true;
}

/** Audience landing routes under /premium (not a single product). */
const PREMIUM_AUDIENCE_SLUGS = new Set([
  "women",
  "men",
  "kids",
  "couple",
]);

/** `/premium` or `/premium/women|men|kids|couple` collection landings. */
export function isPremiumCollectionPath(pathname: string): boolean {
  if (pathname === "/premium") return true;
  if (!pathname.startsWith("/premium/")) return false;
  const slug = pathname.slice("/premium/".length).split("/")[0]?.trim();
  return Boolean(slug && PREMIUM_AUDIENCE_SLUGS.has(slug));
}

/** `/premium/[slug]` premium product detail — not the collection / audience landings. */
export function isPremiumProductDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/premium/")) return false;
  const slug = pathname.slice("/premium/".length).split("/")[0]?.trim();
  if (!slug || PREMIUM_AUDIENCE_SLUGS.has(slug)) return false;
  return true;
}

/** Main shop grid — `/shop`, `/shop/collections`, and legacy `/shop/category/...`. */
export function isStoreShopListingPath(pathname: string): boolean {
  if (pathname === "/shop") return true;
  if (pathname === "/shop/collections") return true;
  if (pathname.startsWith("/shop/collections/")) return true;
  return pathname.startsWith("/shop/category/");
}
