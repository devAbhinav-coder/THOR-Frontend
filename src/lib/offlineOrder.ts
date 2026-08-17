/** Legacy Unsplash placeholders — never show in UI. */
const LEGACY_PLACEHOLDER_FRAGMENTS = [
  'photo-1558618666-fcd25c85cd64',
  'images.unsplash.com/photo-1558618666',
  'photo-1586790170083-2f9ceadc966d',
  'images.unsplash.com/photo-1586790170083',
];

/** Same-origin SVG — reliable in admin UI and order thumbnails. */
export const OFFLINE_MANUAL_LINE_PLACEHOLDER_PATH =
  '/images/offline-line-placeholder.svg';

export const OFFLINE_MANUAL_ITEM_SLUG = 'offline-manual-item';
export const OFFLINE_MANUAL_VARIANT_SKU = 'SYS-OFFLINE-MANUAL';

export function isManualOfflineOrderLine(item: {
  slug?: string;
  isOfflineManual?: boolean;
  variant?: { sku?: string };
}): boolean {
  return (
    item.isOfflineManual === true ||
    item.slug === OFFLINE_MANUAL_ITEM_SLUG ||
    item.variant?.sku === OFFLINE_MANUAL_VARIANT_SKU
  );
}

export function isManualLineMissingCost(item: {
  slug?: string;
  isOfflineManual?: boolean;
  variant?: { sku?: string };
  costAtSale?: number | null;
}): boolean {
  return isManualOfflineOrderLine(item) && !(Number(item.costAtSale ?? 0) > 0);
}

export function orderHasMissingManualLineCost(order: {
  items?: Array<{
    slug?: string;
    isOfflineManual?: boolean;
    variant?: { sku?: string };
    costAtSale?: number | null;
  }>;
}): boolean {
  return (order.items ?? []).some(isManualLineMissingCost);
}

export function countMissingManualLineCosts(order: {
  items?: Array<{
    slug?: string;
    isOfflineManual?: boolean;
    variant?: { sku?: string };
    costAtSale?: number | null;
  }>;
}): number {
  return (order.items ?? []).filter(isManualLineMissingCost).length;
}

export function isLegacyOfflineManualPlaceholder(url: string | undefined | null): boolean {
  const u = url?.trim();
  if (!u) return false;
  return LEGACY_PLACEHOLDER_FRAGMENTS.some((f) => u.includes(f));
}

export function isOfflineManualLinePlaceholder(url: string | undefined | null): boolean {
  const u = url?.trim();
  if (!u) return false;
  return (
    u === OFFLINE_MANUAL_LINE_PLACEHOLDER_PATH ||
    u.endsWith('/images/offline-line-placeholder.svg')
  );
}

export function resolveOfflineManualLineImage(
  categoryImage?: string | null,
): string {
  const cat = categoryImage?.trim();
  if (cat && !isLegacyOfflineManualPlaceholder(cat)) return cat;
  return OFFLINE_MANUAL_LINE_PLACEHOLDER_PATH;
}

export function isUsableOrderLineImage(
  image: string | undefined | null,
  opts?: { isOfflineManual?: boolean },
): boolean {
  const url = image?.trim();
  if (!url) return false;
  if (isLegacyOfflineManualPlaceholder(url)) return false;
  if (url.startsWith('data:image/svg+xml')) return false;
  if (isOfflineManualLinePlaceholder(url)) return true;
  if (opts?.isOfflineManual && url.includes('unsplash.com')) return false;
  return true;
}
