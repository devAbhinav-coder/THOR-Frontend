import type { Product } from "@/types";
import { normProductColor } from "@/lib/productColorImages";
export { colorHasTaggedImages } from "@/lib/pdpImages";

export type ShopListingEntry = {
  product: Product;
  /** Shade for this card — null when product has no color variants. */
  displayColor: string | null;
  listKey: string;
};

export type ProductColorOption = { color: string; colorCode?: string };

export function getProductColorOptions(product: Product): ProductColorOption[] {
  const seen = new Set<string>();
  const out: ProductColorOption[] = [];
  for (const v of product.variants || []) {
    const c = v.color?.trim();
    if (!c) continue;
    const key = normProductColor(c);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ color: c, colorCode: v.colorCode });
  }
  return out;
}

export function getDistinctVariantColors(product: Product): string[] {
  return getProductColorOptions(product).map((o) => o.color);
}

export function isInStockForColor(product: Product, color: string): boolean {
  const key = normProductColor(color);
  if (!key) return false;
  return (product.variants || []).some(
    (v) => normProductColor(v.color) === key && (v.stock ?? 0) > 0,
  );
}

/**
 * One shop card per color when a product has multiple shades (Myntra-style).
 * Single-color / no-color products stay one card.
 */
export function expandProductsForShopListing(
  products: Product[],
): ShopListingEntry[] {
  const out: ShopListingEntry[] = [];
  for (const product of products) {
    const colors = getDistinctVariantColors(product);
    if (colors.length <= 1) {
      out.push({
        product,
        displayColor: colors[0] ?? null,
        listKey: String(product._id),
      });
      continue;
    }
    for (const color of colors) {
      out.push({
        product,
        displayColor: color,
        listKey: `${product._id}::${normProductColor(color)}`,
      });
    }
  }
  return out;
}

export function shopProductHref(
  slug: string,
  displayColor?: string | null,
): string {
  const base = `/shop/${encodeURIComponent(slug)}`;
  const c = displayColor?.trim();
  if (!c) return base;
  return `${base}?color=${encodeURIComponent(c)}`;
}

export function pickVariantForColor<T extends { color?: string; stock?: number }>(
  variants: T[],
  color?: string | null,
): T | null {
  if (!variants.length) return null;
  const key = normProductColor(color);
  if (key) {
    const inStock = variants.find(
      (v) => normProductColor(v.color) === key && (v.stock ?? 0) > 0,
    );
    if (inStock) return inStock;
    const any = variants.find((v) => normProductColor(v.color) === key);
    if (any) return any;
  }
  return variants.find((v) => (v.stock ?? 0) > 0) ?? variants[0] ?? null;
}
