import type { Product, ProductImage } from "@/types";
import { normProductColor } from "@/lib/productColorImages";

/** Images for PDP gallery — ONLY the selected color. No cross-color or untagged bleed. */
export function resolvePdpImages(
  product: Pick<Product, "images">,
  selectedColor?: string,
): ProductImage[] {
  const all = (product.images ?? []).filter((img) => img?.url);
  if (!all.length) return [];

  const colorKey = normProductColor(selectedColor);
  if (!colorKey) {
    const anyTagged = all.some((img) => normProductColor(img.color));
    if (!anyTagged) return all;
    return all.filter((img) => !normProductColor(img.color));
  }

  const forColor = all.filter((img) => normProductColor(img.color) === colorKey);
  if (forColor.length > 0) return forColor;

  const untagged = all.filter((img) => !normProductColor(img.color));
  if (untagged.length > 0) return untagged;

  return all;
}

/** Shop card — strict: only this color's image, no cross-color fallback. */
export function resolveShopCardImage(
  product: Pick<Product, "images">,
  displayColor: string,
): string | null {
  const imgs = resolvePdpImages(product, displayColor);
  return imgs[0]?.url?.trim() || null;
}

export function colorHasTaggedImages(
  product: Pick<Product, "images">,
  color: string,
): boolean {
  const key = normProductColor(color);
  if (!key) return false;
  return (product.images ?? []).some(
    (img) => img?.url && normProductColor(img.color) === key,
  );
}

/** Pick cart/thumbnail image for a variant color. */
export function resolveVariantDisplayImage(
  product: Pick<Product, "images">,
  color?: string,
): string {
  if (color?.trim()) {
    const strict = resolveShopCardImage(product, color);
    if (strict) return strict;
    return "";
  }
  const resolved = resolvePdpImages(product, color);
  return resolved[0]?.url || product.images?.[0]?.url || "";
}
