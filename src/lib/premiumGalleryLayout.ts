export type EditorialRow =
  | { type: "feature"; image: string; align: "start" | "end" }
  | { type: "pair"; left: string; right: string }
  | { type: "single"; image: string };

/**
 * PDP editorial gallery: 1st image (feature) → pairs in the middle → last image (feature).
 * Uses every gallery URL (hero is separate on the page).
 */
export function buildPremiumEditorialRows(
  gallery: string[],
  fallbacks: { editorial: string; craft: string },
): EditorialRow[] {
  const imgs =
    gallery.length > 0 ?
      gallery.filter(Boolean)
    : [fallbacks.editorial, fallbacks.craft];

  if (imgs.length === 1) {
    const only = imgs[0]!;
    return [
      { type: "feature", image: only, align: "start" },
      { type: "feature", image: only, align: "end" },
    ];
  }

  const first = imgs[0]!;
  const last = imgs[imgs.length - 1]!;
  const middle = imgs.slice(1, -1);

  const rows: EditorialRow[] = [
    { type: "feature", image: first, align: "start" },
  ];

  for (let i = 0; i < middle.length; i += 2) {
    if (i + 1 < middle.length) {
      rows.push({ type: "pair", left: middle[i]!, right: middle[i + 1]! });
    } else {
      rows.push({ type: "single", image: middle[i]! });
    }
  }

  rows.push({ type: "feature", image: last, align: "end" });
  return rows;
}
