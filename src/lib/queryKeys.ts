export const queryKeys = {
  /** Full list from `categoryApi.getAll()` — filter with `isShopCatalogCategory` for shop UI. */
  categories: ["categories"] as const,
  /** Navbar shop mega-menu — non-gift categories with subcategories. */
  megaMenu: ["navigation", "mega-menu"] as const,
  storefrontSettings: ["storefront", "settings"] as const,
  notifications: ["notifications"] as const,
  notificationPreferences: ["notifications", "preferences"] as const,
};
