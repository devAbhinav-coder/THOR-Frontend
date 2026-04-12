export const queryKeys = {
  /** Full list from `categoryApi.getAll()` — filter with `isShopCatalogCategory` for shop UI. */
  categories: ["categories"] as const,
  storefrontSettings: ["storefront", "settings"] as const,
  notifications: ["notifications"] as const,
};
