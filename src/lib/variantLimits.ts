import type { ProductVariant } from "@/types";

/** Max units a customer can add — never above live variant stock. */
export function maxPurchasableQty(
  variant: Pick<ProductVariant, "stock"> | null | undefined,
): number {
  const stock = Math.max(0, Number(variant?.stock) || 0);
  return stock;
}

export function clampPurchaseQty(
  qty: number,
  variant: Pick<ProductVariant, "stock"> | null | undefined,
): number {
  const max = maxPurchasableQty(variant);
  if (max < 1) return 1;
  return Math.min(Math.max(1, qty), max);
}
