import type { Product } from "@/types";

/** Matches backend: sum of variant.stock (sellable units). */
export function sumVariantStock(product: Pick<Product, "variants">): number {
  const v = product.variants;
  if (!v?.length) return 0;
  return v.reduce((acc, x) => acc + Math.max(0, Math.floor(Number(x.stock) || 0)), 0);
}

export function hasInStockVariant(product: Pick<Product, "variants">): boolean {
  return product.variants?.some((x) => (Number(x.stock) || 0) > 0) ?? false;
}

/** Short breakdown for admin when multiple SKUs exist (e.g. "4 · 0 · 0"). */
export function variantStockSummary(product: Pick<Product, "variants">): string | null {
  const v = product.variants;
  if (!v || v.length <= 1) return null;
  return v.map((x) => Math.max(0, Math.floor(Number(x.stock) || 0))).join(" · ");
}
