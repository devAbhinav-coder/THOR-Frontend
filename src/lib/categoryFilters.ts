import type { Category } from "@/types";

type GiftCheckable = Pick<Category, "name" | "slug"> & {
  isGiftCategory?: boolean;
};

/**
 * Gift-only categories (admin flag or name/slug heuristics) — belong on `/gifting`, not main shop.
 * Keep in sync with home `CategorySection` behaviour.
 */
export function isGiftCategory(cat: GiftCheckable): boolean {
  if (cat.isGiftCategory) return true;
  const name = String(cat.name || "").toLowerCase();
  const slug = (cat.slug || "").toLowerCase();
  return (
    name.includes("gift") || name.includes("gifting") || slug.includes("gift")
  );
}

/** Navbar shop dropdown, footer “Categories”, home strip — only non-gift / shop catalog. */
export function isShopCatalogCategory(cat: GiftCheckable): boolean {
  return !isGiftCategory(cat);
}
