import type { Category } from "@/types";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

/** Matches Navbar shop dropdown — keep SSR + client lists identical. */
export const SHOP_NAV_CATEGORY_LIMIT = 7;

export async function fetchShopNavCategoriesServer(): Promise<Category[]> {
  const base = await getBuildSafeApiBase();
  if (!base) return [];

  try {
    const res = await fetch(`${base}/categories`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const body = (await res.json()) as {
      data?: { categories?: Category[] };
    };
    const categories = Array.isArray(body?.data?.categories)
      ? body.data.categories
      : [];

    return categories
      .filter(isShopCatalogCategory)
      .slice(0, SHOP_NAV_CATEGORY_LIMIT);
  } catch {
    return [];
  }
}
