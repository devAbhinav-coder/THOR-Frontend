/** `/shop/[slug]` product detail — not listing or collections routes. */
export function isStoreProductDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/shop/")) return false;
  if (pathname.startsWith("/shop/category")) return false;
  if (pathname.startsWith("/shop/collections")) return false;
  return true;
}

/** `/premium/[slug]` premium product detail — not the collection landing. */
export function isPremiumProductDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/premium/")) return false;
  const slug = pathname.slice("/premium/".length).split("/")[0]?.trim();
  return slug.length > 0;
}

/** Main shop grid — `/shop`, `/shop/collections`, and legacy `/shop/category/...`. */
export function isStoreShopListingPath(pathname: string): boolean {
  if (pathname === "/shop") return true;
  if (pathname === "/shop/collections") return true;
  if (pathname.startsWith("/shop/collections/")) return true;
  return pathname.startsWith("/shop/category/");
}
