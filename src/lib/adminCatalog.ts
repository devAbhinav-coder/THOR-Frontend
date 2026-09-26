import { adminApi } from "@/lib/api";
import type { Category, SubCategory } from "@/types";

/** All categories for admin forms (includes inactive - unlike storefront categoryApi). */
export async function fetchAdminCatalogCategories(): Promise<Category[]> {
  try {
    const res = await adminApi.getCategories({ active: false });
    return res.data?.categories || [];
  } catch {
    return [];
  }
}

/** All subcategories for admin filters and forms. */
export async function fetchAdminCatalogSubcategories(): Promise<SubCategory[]> {
  try {
    const res = await adminApi.getSubcategories();
    return res.data?.subcategories || [];
  } catch {
    return [];
  }
}

export function subcategoriesForCategory(
  subcategories: SubCategory[],
  category: Pick<Category, "_id" | "slug"> | undefined,
): SubCategory[] {
  if (!category) return [];
  return subcategories
    .filter((s) => {
      const cid =
        typeof s.categoryId === "string" ?
          s.categoryId
        : (s.categoryId as Category)?._id;
      return cid === category._id || s.categorySlug === category.slug;
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}
