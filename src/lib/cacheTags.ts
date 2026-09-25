/** Must match `next: { tags: [...] }` on storefront settings fetches for ISR invalidation. */
export const STOREFRONT_SETTINGS_CACHE_TAG = "storefront-settings";

/** Product list used by /sitemap.xml and catalog SSR helpers. */
export const CATALOG_PRODUCTS_CACHE_TAG = "catalog-products";

/** Invalidate when any product URL set in the sitemap may have changed. */
export const SITEMAP_CACHE_TAG = "sitemap";

/** Mega-menu categories + subcategories (sitemap collection URLs). */
export const MEGA_MENU_CACHE_TAG = "mega-menu";

/** Premium Edit product list (/premium/products). */
export const PREMIUM_CATALOG_CACHE_TAG = "premium-catalog";

export function productPageCacheTag(slug: string): string {
  const safe = String(slug || "")
    .trim()
    .toLowerCase();
  return `product-${safe}`;
}
