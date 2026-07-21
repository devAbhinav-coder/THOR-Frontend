/** Shared catalog attribute helpers — colors/fabrics for filters + admin. */

export function catalogMatchKey(value: string | undefined | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function toTitleCaseLabel(value: string): string {
  return String(value ?? "")
    .trim()
    .replace(/[\s/_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreCatalogLabel(label: string): number {
  const trimmed = String(label || "").trim();
  if (!trimmed) return -Infinity;
  let score = 0;
  const hasLower = /[a-z]/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  if (hasLower && hasUpper) score += 12;
  if (/\s/.test(trimmed)) score += 8;
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) score -= 8;
  if (trimmed === trimmed.toLowerCase()) score -= 3;
  score += Math.min(trimmed.length, 24);
  return score;
}

export function pickCanonicalLabel(candidates: string[]): string {
  const cleaned = candidates
    .map((c) => String(c || "").trim())
    .filter(Boolean);
  if (!cleaned.length) return "";

  const spaced = cleaned.filter((c) => /\s/.test(c));
  const pool = spaced.length ? spaced : cleaned;

  let best = pool[0]!;
  let bestScore = scoreCatalogLabel(best);
  for (let i = 1; i < pool.length; i++) {
    const next = pool[i]!;
    const score = scoreCatalogLabel(next);
    if (
      score > bestScore ||
      (score === bestScore && next.localeCompare(best) < 0)
    ) {
      best = next;
      bestScore = score;
    }
  }

  const titled = toTitleCaseLabel(best);
  return catalogMatchKey(titled) === catalogMatchKey(best) ? titled : best;
}

export function dedupeCatalogLabels(values: string[]): string[] {
  const byKey = new Map<string, string[]>();
  for (const value of values) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = catalogMatchKey(trimmed);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(trimmed);
    byKey.set(key, list);
  }
  return Array.from(byKey.values())
    .map(pickCanonicalLabel)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function resolveColorAgainstCatalog(
  input: string,
  catalog: string[] = [],
): string {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  const key = catalogMatchKey(trimmed);
  if (!key) return "";
  for (const existing of catalog) {
    if (catalogMatchKey(existing) === key) {
      return String(existing).trim();
    }
  }
  return toTitleCaseLabel(trimmed);
}
