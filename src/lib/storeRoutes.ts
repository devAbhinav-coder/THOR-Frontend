/** `/shop/[slug]` product detail — not `/shop` or `/shop/category/...`. */
export function isStoreProductDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/shop/")) return false;
  if (pathname.startsWith("/shop/category")) return false;
  return true;
}

/** Main shop grid — `/shop` and `/shop/category/...`. */
export function isStoreShopListingPath(pathname: string): boolean {
  return pathname === "/shop" || pathname.startsWith("/shop/category");
}
