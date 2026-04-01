/**
 * React list key for cart / checkout lines. SKU alone is not unique when the same
 * variant is added twice with different customFieldAnswers — duplicate keys cause
 * row reuse and wrong product images after quantity/remove updates.
 */
export function cartLineReactKey(item: {
  product?: unknown;
  variant: { sku: string };
  customFieldAnswers?: { label: string; value: string }[];
}): string {
  const p = item.product;
  const productId =
    p && typeof p === "object" && p !== null && "_id" in p ?
      String((p as { _id: string })._id)
    : typeof p === "string" ? p
    : "unknown";
  const ansKey =
    item.customFieldAnswers?.length ?
      [...item.customFieldAnswers]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((a) => `${a.label}=${a.value}`)
        .join("&")
    : "";
  return `${productId}::${item.variant.sku}::${ansKey}`;
}
