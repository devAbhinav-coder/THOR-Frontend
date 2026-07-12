import { adminApi } from "@/lib/api";
import type { Category } from "@/types";

/** All categories for admin forms (includes inactive — unlike storefront categoryApi). */
export async function fetchAdminCatalogCategories(): Promise<Category[]> {
  try {
    const res = await adminApi.getCategories({ active: false });
    return res.data?.categories || [];
  } catch {
    return [];
  }
}
