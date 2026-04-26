import type { Category } from "@/types";

export function toShopCategorySlug(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildShopCategoryHref(category: Pick<Category, "name" | "slug">): string {
  const slug = String(category.slug || "").trim();
  const safeSlug = slug || toShopCategorySlug(category.name);
  return `/shop/category/${encodeURIComponent(safeSlug)}`;
}

export function resolveCategoryBySlug(
  categories: Category[],
  categorySlug: string,
): Category | null {
  const wanted = toShopCategorySlug(categorySlug);
  if (!wanted) return null;
  for (const category of categories) {
    const slugCandidate = toShopCategorySlug(category.slug || category.name);
    if (slugCandidate === wanted) return category;
  }
  return null;
}
