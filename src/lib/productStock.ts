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

/** Short breakdown for admin when multiple SKUs exist (e.g. "Red:4 · Blue:2" or "4 · 0 · 0"). */
export function variantStockSummary(product: Pick<Product, "variants">): string | null {
  const v = product.variants;
  if (!v?.length) return null;

  const colorKeys = new Set(
    v.map((x) => String(x.color ?? "").trim().toLowerCase()).filter(Boolean),
  );

  if (colorKeys.size > 1) {
    const parts: string[] = [];
    const seen = new Set<string>();
    for (const row of v) {
      const color = row.color?.trim();
      if (!color) continue;
      const key = color.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const stock = v
        .filter((x) => String(x.color ?? "").trim().toLowerCase() === key)
        .reduce((n, x) => n + Math.max(0, Math.floor(Number(x.stock) || 0)), 0);
      parts.push(`${color}:${stock}`);
    }
    return parts.length ? parts.join(" · ") : null;
  }

  if (v.length <= 1) return null;
  return v.map((x) => Math.max(0, Math.floor(Number(x.stock) || 0))).join(" · ");
}
