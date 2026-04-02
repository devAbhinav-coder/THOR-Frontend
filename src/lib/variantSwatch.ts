import { normalizeCssColor } from "@/lib/normalizeCssColor";

/** CSS `background` for catalog / PDP when color is multicolor (no single hex). */
export const MULTICOLOR_SWATCH_BG =
  "linear-gradient(135deg, #ef4444 0%, #eab308 22%, #22c55e 44%, #3b82f6 66%, #a855f7 88%)";

/**
 * Stored in `colorCode` when admin picks “Multicolor / print” so the storefront shows a gradient
 * for any custom label (not only keywords like “Multicolor”).
 */
export const VARIANT_MULTICOLOR_MARKER = "__hr_multicolor";

/** True if the color *name* alone should imply multicolor (legacy / manual text-only rows). */
export function isMulticolorLabel(color?: string | null): boolean {
  const t = (color ?? "").trim().toLowerCase();
  if (!t) return false;
  return (
    /^(multicolor|multi|assorted|mixed|rainbow|printed|print)$/i.test(t) ||
    /\bmulticolor\b/i.test(t)
  );
}

function isMulticolorVariant(color?: string | null, colorCode?: string | null): boolean {
  if ((colorCode ?? "").trim() === VARIANT_MULTICOLOR_MARKER) return true;
  return isMulticolorLabel(color);
}

/** Background for a round swatch: gradient, solid hex/name, or null (use text-only pill). */
export function variantSwatchBackground(
  color?: string | null,
  colorCode?: string | null,
): string | null {
  if (isMulticolorVariant(color, colorCode)) return MULTICOLOR_SWATCH_BG;
  return normalizeCssColor(colorCode ?? undefined, color ?? undefined);
}
