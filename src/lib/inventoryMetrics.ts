import { formatPrice } from '@/lib/utils';

export interface CatalogProfitInput {
  soldCount: number;
  sellPrice: number;
  avgCost: number;
}

export function buildCatalogProfitBreakdown({
  soldCount,
  sellPrice,
  avgCost,
}: CatalogProfitInput) {
  const grossRevenue = soldCount * sellPrice;
  const grossCostOfSales = soldCount * avgCost;
  const grossProfit = grossRevenue - grossCostOfSales;
  const marginPercent =
    sellPrice > 0 && avgCost > 0 ?
      Math.round(((sellPrice - avgCost) / sellPrice) * 100)
    : null;

  return { grossRevenue, grossCostOfSales, grossProfit, marginPercent };
}

export function formatTurnover(turnover: number | null | undefined): string {
  if (turnover == null) return 'Sold out';
  if (turnover === 0) return '0x';
  return `${turnover.toFixed(1)}x`;
}

export const INVENTORY_METRIC_NOTES = {
  estMeaning:
    '"Est." = estimated from catalog (units already sold × price/cost). Past sales math — NOT a future forecast.',
  catalogVsOrders:
    'This is catalog math. Actual cash collected is on the Revenue page (paid orders).',
  productLevelSales:
    'Each size/color SKU has its own soldCount. Product total = sum of all SKUs.',
  variantSoldCount:
    'Each SKU (size + color) tracks sold units separately in variant breakdown.',
  costMethod:
    'Purchase bills update cost using WAC (weighted average cost).',
  avgCost:
    'Avg cost = stock-weighted average of variant purchase costs currently on hand.',
  avgMrp:
    'Each SKU uses its own list price. Lifetime revenue = Σ (SKU sold × SKU sell price).',
  effectiveSellPrice:
    'Blended avg sell when SKU sold counts are missing; otherwise per-SKU sum.',
  variantStock:
    'Stock, cost & MRP are per SKU. totalStock = sum of all variant stocks.',
} as const;

export function summaryTooltipLines(input: {
  sold: number;
  grossRevenue: number;
  grossCost: number;
  grossProfit: number;
  margin: number | null;
  stockAtCost: number;
  stockAtMrp: number;
}) {
  return {
    unitsSold: [
      { label: 'Units sold', value: input.sold.toLocaleString('en-IN') },
      { label: 'Per SKU', value: 'Size + color wise' },
    ],
    grossRevenue: [
      { label: 'Meaning', value: 'Est. = catalog estimate' },
      { label: 'Formula', value: 'Σ (SKU sold × SKU sell price)' },
      { label: 'Example', value: 'Red 50×₹999 + Blue 10×₹1299' },
      { label: 'Total', value: formatPrice(input.grossRevenue), highlight: true },
    ],
    grossProfit: [
      { label: 'Est. revenue', value: formatPrice(input.grossRevenue) },
      { label: 'Minus COGS', value: formatPrice(input.grossCost) },
      { label: 'COGS =', value: 'Σ (SKU sold × SKU cost)' },
      { label: 'Gross profit', value: formatPrice(input.grossProfit), highlight: true },
    ],
    margin: [
      { label: 'Formula', value: '(MRP − cost) ÷ MRP' },
      { label: 'Or', value: 'profit ÷ revenue' },
      { label: 'Margin', value: input.margin != null ? `${input.margin}%` : '—', highlight: true },
    ],
    stockAtCost: [
      { label: 'Formula', value: 'Σ (cost × stock)' },
      { label: 'Godown value', value: formatPrice(input.stockAtCost), highlight: true },
    ],
    stockAtMrp: [
      { label: 'Formula', value: 'Σ (MRP × stock)' },
      { label: 'List value', value: formatPrice(input.stockAtMrp), highlight: true },
    ],
  };
}

export function productRowTooltipLines(product: {
  soldCount: number;
  price: number;
  effectiveSellPrice?: number;
  hasVariantPriceSpread?: boolean;
  avgCost?: number;
  grossRevenue?: number;
  grossCostOfSales?: number;
  grossProfit?: number;
  marginPercent?: number | null;
  isPeriodView?: boolean;
}) {
  const sold = product.soldCount ?? 0;
  const avgCost = product.avgCost ?? 0;

  if (product.isPeriodView) {
    return [
      { label: 'Units sold (period)', value: String(sold) },
      { label: 'Source', value: 'Paid order lines' },
      { label: 'Gross revenue', value: formatPrice(product.grossRevenue ?? 0) },
      { label: 'COGS', value: formatPrice(product.grossCostOfSales ?? 0) },
      {
        label: 'Gross profit',
        value: formatPrice(product.grossProfit ?? 0),
        highlight: true,
      },
      {
        label: 'Margin',
        value:
          product.marginPercent != null ? `${product.marginPercent}%` : '—',
      },
    ];
  }

  return [
    { label: 'Units sold', value: String(sold) },
    {
      label: 'Revenue formula',
      value: product.hasVariantPriceSpread ?
        'Σ (each SKU sold × SKU sell)'
      : 'units sold × sell price',
    },
    { label: 'Avg cost (on-hand)', value: avgCost > 0 ? formatPrice(avgCost) : 'Not set' },
    { label: 'Gross revenue', value: formatPrice(product.grossRevenue ?? 0) },
    { label: 'COGS', value: formatPrice(product.grossCostOfSales ?? 0) },
    {
      label: 'Gross profit',
      value: formatPrice(product.grossProfit ?? 0),
      highlight: true,
    },
    {
      label: 'Margin',
      value:
        product.marginPercent != null ? `${product.marginPercent}%` : '—',
    },
  ];
}
