export type ProductDetailPair = { key: string; value: string };

/**
 * Split bulk input: multiple lines → one item per line; single line → comma-separated.
 * Trims each part; drops empty parts.
 */
export function parseDetailBulkLine(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const lines = t
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  return t.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
}

export function countDetailParts(raw: string): number {
  return parseDetailBulkLine(raw).length;
}

/** Encode existing pairs for textarea (newline = safe round-trip for commas inside values). */
export function bulkTextFromPairs(pairs: ProductDetailPair[]): {
  keysText: string;
  valuesText: string;
} {
  const filtered = pairs.filter((p) => p.key.trim() || p.value.trim());
  return {
    keysText: filtered.map((p) => p.key.trim()).join("\n"),
    valuesText: filtered.map((p) => p.value.trim()).join("\n"),
  };
}

/**
 * Build aligned key/value rows for the API. Same validation: N keys ⇒ N values.
 */
export function pairsFromBulkInput(
  keysRaw: string,
  valuesRaw: string,
):
  | { ok: true; pairs: ProductDetailPair[] }
  | { ok: false; error: string } {
  const keys = parseDetailBulkLine(keysRaw);
  const values = parseDetailBulkLine(valuesRaw);
  if (keys.length === 0 && values.length === 0) {
    return { ok: true, pairs: [] };
  }
  if (keys.length !== values.length) {
    return {
      ok: false,
      error: `Product details: ${keys.length} key(s) but ${values.length} value(s). Use the same count (e.g. 4 keys → 4 values).`,
    };
  }
  return {
    ok: true,
    pairs: keys.map((key, i) => ({ key, value: values[i]! })),
  };
}
