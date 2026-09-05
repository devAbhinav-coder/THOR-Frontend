import { useMemo } from "react";

const RESERVED_DETAIL_LABELS = new Set([
  "category",
  "subcategory",
  "fabric",
  "sku",
  "tags",
]);

/** Admin "Product specs table" key/value pairs — shown as-is on PDP. */
export function buildPdpFormSpecPairs(
  productDetails?: { key: string; value: string }[],
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const d of productDetails ?? []) {
    const label = String(d.key ?? "").trim();
    const value = String(d.value ?? "").trim();
    if (!label || !value) continue;
    rows.push({ label, value });
  }
  return rows;
}

export function buildPdpSpecRows(input: {
  category: string;
  subcategory?: string;
  fabric?: string;
  sku: string;
  tags: string[];
  occasions?: string[];
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
  if ((input.occasions?.length ?? 0) > 0) {
    add("Occasions", (input.occasions ?? []).join(", "));
  }

  for (const d of input.productDetails ?? []) {
    if (!d.key?.trim() || !d.value?.trim()) continue;
    const detailKey = d.key.toLowerCase().trim();
    if (/care|wash|iron|dry|maintain/i.test(detailKey)) continue;
    if (RESERVED_DETAIL_LABELS.has(detailKey)) continue;
    if (detailKey === "occasions" || detailKey === "occasion") continue;
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
    input.occasions,
    input.productDetails,
  ]);
}
