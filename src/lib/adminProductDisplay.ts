import type { Product } from "@/types";
import { resolveShopCardImage } from "@/lib/pdpImages";
import { getDistinctVariantColors } from "@/lib/shopProductListing";

/** Best thumbnail for admin product list (first color with a tagged photo). */
export function adminProductListThumbnail(product: Product): string {
  const colors = getDistinctVariantColors(product);
  for (const color of colors) {
    const url = resolveShopCardImage(product, color);
    if (url) return url;
  }
  return product.images?.[0]?.url?.trim() || "/placeholder.jpg";
}
