import { useMemo } from "react";

const RESERVED_DETAIL_LABELS = new Set([
  "category",
  "subcategory",
  "fabric",
  "sku",
  "tags",
]);

export function buildPdpSpecRows(input: {
  category: string;
  subcategory?: string;
  fabric?: string;
  sku: string;
  tags: string[];
  productDetails?: { key: string; value: string }[];
}): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  const add = (label: string, value?: string | null) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return;
    const key = label.toLowerCase().trim();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ label, value: trimmed });
  };

  add("Category", input.category);
  add("Subcategory", input.subcategory);
  add("Fabric", input.fabric);
  add("SKU", input.sku);
  if (input.tags.length > 0) add("Tags", input.tags.join(", "));

  for (const d of input.productDetails ?? []) {
    if (!d.key?.trim() || !d.value?.trim()) continue;
    const detailKey = d.key.toLowerCase().trim();
    if (/care|wash|iron|dry|maintain/i.test(detailKey)) continue;
    if (RESERVED_DETAIL_LABELS.has(detailKey)) continue;
    add(d.key.trim(), d.value.trim());
  }

  return rows;
}

export function usePdpSpecRows(
  input: Parameters<typeof buildPdpSpecRows>[0],
): { label: string; value: string }[] {
  return useMemo(() => buildPdpSpecRows(input), [
    input.category,
    input.subcategory,
    input.fabric,
    input.sku,
    input.tags,
    input.productDetails,
  ]);
}
