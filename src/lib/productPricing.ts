import type { Product, ProductVariant } from '@/types';
import { formatPrice } from '@/lib/utils';
import { normProductColor } from '@/lib/productColorImages';
import { pickVariantForColor } from '@/lib/shopProductListing';

export type StorefrontPriceDisplay = {
  sellLabel: string;
  mrpLabel: string | null;
  fromPrefix: boolean;
  hasSpread: boolean;
  discountPercent: number;
  showDiscount: boolean;
  saleBadge: string | null;
  /** Lowest sell — for schema.org / cart */
  primarySell: number;
  /** Strikethrough MRP when above sell */
  primaryMrp: number | null;
};

export type SelectedVariantPriceDisplay = {
  sell: number;
  sellLabel: string;
  mrp: number | null;
  mrpLabel: string | null;
  discountPercent: number;
  showDiscount: boolean;
  saveAmount: number;
  saleBadge: string | null;
};

function hasCustomVariantListPrice(
  variant: Pick<ProductVariant, 'price'>,
): boolean {
  return typeof variant.price === 'number' && variant.price >= 0;
}

/** Catalog list price for one SKU (before sale). */
function variantCatalogListPrice(
  variant: Pick<ProductVariant, 'price' | 'listPrice'>,
  product: Pick<Product, 'price' | 'catalogBasePrice'>,
): number {
  if (typeof variant.listPrice === 'number' && variant.listPrice >= 0) {
    return variant.listPrice;
  }
  if (hasCustomVariantListPrice(variant)) {
    return variant.price!;
  }
  if (
    typeof product.catalogBasePrice === 'number' &&
    product.catalogBasePrice >= 0
  ) {
    return product.catalogBasePrice;
  }
  return Number(product.price ?? 0);
}

/** Client-side sale when API omitted variant.sellPrice (cached/stale payloads). */
function applyClientSaleToListPrice(
  product: Pick<
    Product,
    'price' | 'comparePrice' | 'effectivePrice' | 'catalogBasePrice'
  >,
  listPrice: number,
): number {
  const catalogBase =
    typeof product.catalogBasePrice === 'number' && product.catalogBasePrice > 0
      ? product.catalogBasePrice
      : null;

  if (
    catalogBase != null &&
    typeof product.effectivePrice === 'number' &&
    product.effectivePrice < catalogBase
  ) {
    return Math.round((listPrice * product.effectivePrice / catalogBase) * 100) / 100;
  }

  const sell = Number(product.price ?? 0);
  const compare = product.comparePrice;
  if (compare != null && compare > sell && compare > 0 && catalogBase != null) {
    if (Math.abs(compare - catalogBase) < 0.01) {
      return Math.round((listPrice * sell / compare) * 100) / 100;
    }
  }

  return listPrice;
}

export function variantSellPrice(
  variant: Pick<ProductVariant, 'price' | 'sellPrice' | 'listPrice'>,
  product: Pick<
    Product,
    'price' | 'comparePrice' | 'effectivePrice' | 'catalogBasePrice'
  >,
): number {
  if (typeof variant.sellPrice === 'number' && variant.sellPrice >= 0) {
    return variant.sellPrice;
  }
  const list = variantCatalogListPrice(variant, product);
  return applyClientSaleToListPrice(product, list);
}

export function variantMrp(
  variant: Pick<ProductVariant, 'price' | 'sellPrice' | 'mrp' | 'listPrice'>,
  product: Pick<Product, 'price' | 'comparePrice'>,
  sell: number,
): number | null {
  if (typeof variant.mrp === 'number' && variant.mrp > sell) {
    return variant.mrp;
  }
  const productMrp = product.comparePrice;
  if (productMrp != null && productMrp > sell) {
    return productMrp;
  }
  const list =
    typeof variant.listPrice === 'number' ? variant.listPrice
    : hasCustomVariantListPrice(variant) ? variant.price!
    : null;
  if (list != null && list > sell) {
    return list;
  }
  return null;
}

/** Variants included on a listing card (all SKUs, or one shade when expanded). */
function listingScopeVariants(
  product: Pick<Product, 'variants'>,
  displayColor?: string | null,
): ProductVariant[] {
  const variants = product.variants ?? [];
  if (!displayColor?.trim()) return variants;
  const key = normProductColor(displayColor);
  if (!key) return variants;
  return variants.filter((v) => normProductColor(v.color) === key);
}

/** Storefront cards: sell for this card's shade/SKUs — single price, never a range. */
export function getListingSellPrice(
  product: Pick<
    Product,
    'price' | 'comparePrice' | 'effectivePrice' | 'catalogBasePrice' | 'variants'
  >,
  displayColor?: string | null,
): number {
  const scoped = listingScopeVariants(product, displayColor);
  if (scoped.length > 0) {
    const sells = scoped.map((v) => variantSellPrice(v, product));
    const cents = new Set(sells.map((p) => Math.round(p * 100)));
    if (cents.size === 1) return sells[0]!;
    return Math.min(...sells);
  }

  if (
    typeof product.catalogBasePrice === 'number' &&
    product.catalogBasePrice >= 0
  ) {
    return applyClientSaleToListPrice(product, product.catalogBasePrice);
  }
  const variants = product.variants ?? [];
  const defaultVariant = variants.find((v) => !hasCustomVariantListPrice(v));
  if (defaultVariant) {
    return variantSellPrice(defaultVariant, product);
  }
  if (variants.length > 0) {
    return variantSellPrice(variants[0], product);
  }
  return Number(product.price ?? 0);
}

function getListingMrp(
  product: Product,
  listingSell: number,
  displayColor?: string | null,
): number | null {
  const scoped = listingScopeVariants(product, displayColor);
  const rep =
    pickVariantForColor(scoped, displayColor) ??
    scoped.find((v) => (v.stock ?? 0) > 0) ??
    scoped[0];
  if (rep) {
    return variantMrp(rep, product, listingSell);
  }
  const compare = product.comparePrice;
  return compare != null && compare > listingSell ? compare : null;
}

export function getStorefrontPriceDisplay(
  product: Product,
  displayColor?: string | null,
): StorefrontPriceDisplay {
  const saleBadge = product.saleCampaignId ? product.saleBadge ?? null : null;
  const listingSell = getListingSellPrice(product, displayColor);

  const sellLabel = formatPrice(listingSell);
  const primaryMrp = getListingMrp(product, listingSell, displayColor);

  let discountPercent = 0;
  if (product.saleCampaignId && primaryMrp != null && primaryMrp > listingSell && primaryMrp > 0) {
    discountPercent = Math.round(
      ((primaryMrp - listingSell) / primaryMrp) * 100,
    );
  } else if (!displayColor && product.saleCampaignId && (product.discountPercent ?? 0) > 0) {
    discountPercent = product.discountPercent ?? 0;
  }

  return {
    sellLabel,
    mrpLabel: primaryMrp != null ? formatPrice(primaryMrp) : null,
    fromPrefix: false,
    hasSpread: false,
    discountPercent,
    showDiscount: Boolean(product.saleCampaignId) && (discountPercent >= 1 || !!saleBadge),
    saleBadge,
    primarySell: listingSell,
    primaryMrp,
  };
}

export function resolveVariantStorefrontPrice(
  product: Product,
  variant: ProductVariant,
): number {
  return variantSellPrice(variant, product);
}

export function resolveVariantStorefrontMrp(
  product: Product,
  variant: ProductVariant,
  sell?: number,
): number | null {
  const s = sell ?? resolveVariantStorefrontPrice(product, variant);
  return variantMrp(variant, product, s);
}

/** PDP: exact sell/MRP/discount for the currently selected SKU (never a range). */
export function getSelectedVariantPriceDisplay(
  product: Product,
  variant: ProductVariant,
): SelectedVariantPriceDisplay {
  const sell = resolveVariantStorefrontPrice(product, variant);
  const mrp = resolveVariantStorefrontMrp(product, variant, sell);
  const saveAmount = mrp != null && mrp > sell ? mrp - sell : 0;
  const saleBadge = product.saleCampaignId ? product.saleBadge ?? null : null;
  let discountPercent = 0;
  if (product.saleCampaignId && mrp != null && mrp > sell && mrp > 0) {
    discountPercent = Math.round(((mrp - sell) / mrp) * 100);
  }
  return {
    sell,
    sellLabel: formatPrice(sell),
    mrp,
    mrpLabel: mrp != null ? formatPrice(mrp) : null,
    discountPercent,
    showDiscount: Boolean(product.saleCampaignId) && (discountPercent >= 1 || !!saleBadge),
    saveAmount,
    saleBadge,
  };
}

// ── Admin / inventory (catalog list prices, no sale enrichment) ──

/** Catalog list/sell price for one SKU in admin (no storefront sale). */
export function variantCatalogSellPrice(
  variant: Pick<ProductVariant, 'price'>,
  productPrice: number,
): number {
  if (typeof variant.price === 'number' && variant.price >= 0) {
    return variant.price;
  }
  return Number(productPrice ?? 0);
}

export function variantCatalogMrp(
  variant: Pick<ProductVariant, 'price'>,
  product: Pick<Product, 'price' | 'comparePrice'>,
): number | null {
  const sell = variantCatalogSellPrice(variant, product.price);
  const compare = product.comparePrice;
  if (compare != null && compare > sell) return compare;
  return null;
}

export function collectVariantSellPrices(
  product: Pick<Product, 'price' | 'variants' | 'catalogBasePrice'>,
): number[] {
  const base =
    typeof product.catalogBasePrice === 'number'
      ? product.catalogBasePrice
      : Number(product.price ?? 0);
  const variants = product.variants ?? [];
  if (!variants.length) return base > 0 ? [base] : [];
  return variants
    .map((v) => {
      if (typeof v.price === 'number' && v.price >= 0) return v.price;
      return base;
    })
    .filter((p) => p >= 0);
}

export function hasVariantSellSpread(
  product: Pick<Product, 'price' | 'variants' | 'hasVariantPriceSpread' | 'catalogBasePrice'>,
): boolean {
  if (product.hasVariantPriceSpread) return true;
  const prices = collectVariantSellPrices(product);
  if (prices.length <= 1) return false;
  return new Set(prices.map((p) => Math.round(p * 100))).size > 1;
}

export function formatSellPriceRange(
  product: Pick<Product, 'price' | 'variants' | 'sellPriceMin' | 'sellPriceMax' | 'hasVariantPriceSpread'>,
): string {
  if (
    typeof product.sellPriceMin === 'number' &&
    typeof product.sellPriceMax === 'number' &&
    Math.round(product.sellPriceMin * 100) !== Math.round(product.sellPriceMax * 100)
  ) {
    return `${formatPrice(product.sellPriceMin)} – ${formatPrice(product.sellPriceMax)}`;
  }
  const prices = collectVariantSellPrices(product);
  if (!prices.length) return formatPrice(product.price ?? 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (Math.round(min * 100) === Math.round(max * 100)) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

export type ProductPriceDisplay = {
  sellLabel: string;
  mrpLabel: string | null;
  spreadNote: string | null;
  hasSpread: boolean;
};

export function getProductPriceDisplay(
  product: Pick<Product, 'price' | 'comparePrice' | 'variants' | 'sellPriceMin' | 'sellPriceMax' | 'hasVariantPriceSpread' | 'catalogBasePrice'>,
): ProductPriceDisplay {
  const hasSpread = hasVariantSellSpread(product);
  const sellLabel =
    hasSpread ? formatSellPriceRange(product) : formatPrice(product.price ?? 0);

  const prices = collectVariantSellPrices(product);
  const sellMax = prices.length ? Math.max(...prices) : product.price;
  const compare = product.comparePrice;
  const mrpLabel =
    compare != null && compare > sellMax ? formatPrice(compare) : null;

  const spreadNote =
    hasSpread ?
      `${product.variants?.length ?? 0} SKUs · per-variant sell prices`
    : null;

  return { sellLabel, mrpLabel, spreadNote, hasSpread };
}

export function variantPriceOverridesBase(
  variant: Pick<ProductVariant, 'price' | 'sellPrice'>,
  productPrice: number,
): boolean {
  if (typeof variant.price === 'number' && variant.price >= 0) {
    return Math.round(variant.price * 100) !== Math.round(productPrice * 100);
  }
  return false;
}

function toMerchantPrice(n: number): string {
  return n.toFixed(2);
}

export function storefrontPriceMeta(
  product: Product,
  displayColor?: string | null,
) {
  const d = getStorefrontPriceDisplay(product, displayColor);
  return {
    priceContent: toMerchantPrice(d.primarySell),
    priceCurrency: 'INR',
    ariaLabel: `Price: ${d.sellLabel}`,
  };
}
