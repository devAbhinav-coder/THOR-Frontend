import type { Product } from "@/types";

/** True when PDP/card should use gifting/customize flow instead of quick add-to-cart. */
export function productNeedsCustomization(
  product: Pick<Product, "isCustomizable" | "customFields">,
): boolean {
  return (
    Boolean(product.isCustomizable) ||
    (Array.isArray(product.customFields) && product.customFields.length > 0)
  );
}
