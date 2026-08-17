import { cache } from "react";
import type { Category, MegaMenuCategory } from "@/types";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { serverFetch } from "@/lib/serverFetch";

/** Matches Navbar shop dropdown — keep SSR + client lists identical. */
export const SHOP_NAV_CATEGORY_LIMIT = 7;

const fetchMegaMenuCached = cache(async (): Promise<MegaMenuCategory[]> => {
  const base = await getBuildSafeApiBase();
  if (!base) return [];

  try {
    const res = await serverFetch(`${base}/navigation/mega-menu`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const body = (await res.json()) as {
      data?: { categories?: MegaMenuCategory[] };
    };
    return Array.isArray(body?.data?.categories) ? body.data.categories : [];
  } catch {
    return [];
  }
});

export async function fetchShopNavCategoriesServer(): Promise<MegaMenuCategory[]> {
  const categories = await fetchMegaMenuCached();
  return categories
    .filter(isShopCatalogCategory)
    .slice(0, SHOP_NAV_CATEGORY_LIMIT);
}
