/** Variant ref for Meta catalog / pixel IDs (matches merchant feed + order line items). */
export type MetaCatalogVariantRef = {
  sku?: string;
  _id?: string;
};

/**
 * Canonical catalog item id — must match `/api/feed` `<g:id>` and pixel `content_ids`.
 * Prefers variant SKU; falls back to `{productId}_{variantId}` then product id alone.
 */
export function getMetaCatalogItemId(
  productId: string | undefined,
  variant?: MetaCatalogVariantRef | null,
): string {
  const sku = variant?.sku?.trim();
  if (sku) return sku;

  const variantId =
    variant?._id != null && String(variant._id).trim() ?
      String(variant._id).trim()
    : "";

  const pid = productId != null ? String(productId).trim() : "";
  if (pid && variantId) return `${pid}_${variantId}`;
  if (pid) return pid;
  return variantId || "unknown";
}

/** Parent product id for catalog item groups (`<g:item_group_id>`). */
export function getMetaItemGroupId(productId: string): string {
  return String(productId);
}
