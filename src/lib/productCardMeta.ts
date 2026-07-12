import type { Product } from "@/types";

/** Fabric · subcategory · category — deduped, no redundant labels. */
export function buildProductMetaLine(product: Pick<
  Product,
  "fabric" | "subcategory" | "category"
>): string {
  const fabric = product.fabric?.trim();
  const sub = product.subcategory?.trim();
  const cat = product.category?.trim();
  const parts: string[] = [];

  if (fabric) parts.push(fabric.toUpperCase());

  const subKey = sub?.toLowerCase();
  const catKey = cat?.toLowerCase();
  if (sub && subKey !== catKey) {
    parts.push(sub.toUpperCase());
  } else if (cat && !fabric) {
    parts.push(cat.toUpperCase());
  } else if (cat && fabric && catKey !== fabric.toLowerCase()) {
    parts.push(cat.toUpperCase());
  }

  return parts.filter((part, i, arr) => arr.indexOf(part) === i).join(" · ");
}
