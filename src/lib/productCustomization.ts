import type { Product } from "@/types";

/** True when PDP should show admin-configured custom fields and/or quote flow. */
export function productNeedsCustomization(
  product: Pick<Product, "isCustomizable" | "customFields">,
): boolean {
  return (
    Boolean(product.isCustomizable) ||
    (Array.isArray(product.customFields) && product.customFields.length > 0)
  );
}
