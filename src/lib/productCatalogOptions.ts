/** Shared catalog options — admin product form + shop filters stay in sync. */
export const PRODUCT_OCCASIONS = [
  "Wedding",
  "Bridal",
  "Reception",
  "Festive",
  "Party",
  "Casual",
  "Office / Formal",
  "Daily Wear",
] as const;

export type ProductOccasion = (typeof PRODUCT_OCCASIONS)[number];

/** Admin + storefront — saree / ethnic wear size presets (Free Size default). */
export const PRODUCT_SIZES = [
  "Free Size",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export function isPresetProductSize(size: string): boolean {
  const key = size.trim().toLowerCase();
  return PRODUCT_SIZES.some((s) => s.toLowerCase() === key);
}

export function nextUnusedProductSize(existing: string[]): string {
  const used = new Set(existing.map((s) => s.trim().toLowerCase()).filter(Boolean));
  for (const preset of PRODUCT_SIZES) {
    if (!used.has(preset.toLowerCase())) return preset;
  }
  return "Free Size";
}

export const PRODUCT_FABRICS = [
  "Silk",
  "Cotton",
  "Chiffon",
  "Georgette",
  "Banarasi",
  "Kanjeevaram",
  "Linen",
  "Crepe",
  "Net",
  "Velvet",
  "Jacquard",
  "Chanderi",
  "Other",
] as const;

export function mergeOccasionOptions(
  fromProducts: string[] = [],
  custom: string[] = [],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of [...PRODUCT_OCCASIONS, ...fromProducts, ...custom]) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
