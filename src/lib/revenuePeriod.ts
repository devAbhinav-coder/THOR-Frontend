import type { DashboardAnalytics } from '@/types';

export type RevenuePeriod = 'month' | 'year' | 'lifetime';

export type RevenuePeriodSummary = {
  period: RevenuePeriod;
  year: number;
  month: number;
  label: string;
  overview: {
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    refundedOrdersCount: number;
    productRevenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    orders: number;
    couponDiscountTotal: number;
    couponOrdersCount: number;
    shippingCollected: number;
    codFeeCollected: number;
    taxCollected: number;
    nonRefundableFeesRetained: number;
  };
  revenueByMonth: DashboardAnalytics['revenueByMonth'];
  profitByMonth: NonNullable<DashboardAnalytics['profitByMonth']>;
  refundsByMonth: { _id: { year: number; month: number }; refunds: number; count: number }[];
  topProductsByProfit: NonNullable<DashboardAnalytics['topProductsByProfit']>;
  categoryProfit: NonNullable<DashboardAnalytics['categoryProfit']>;
  paymentMethodMix?: { _id: string; revenue: number; count: number }[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

export function formatMonthLabel(year: number, month: number) {
  return `${MONTHS[month - 1]} ${String(year).slice(-2)}`;
}

/** Years present in order revenue series, newest first. */
export function availableYearsFromAnalytics(analytics: DashboardAnalytics): number[] {
  const years = new Set<number>();
  for (const r of analytics.revenueByMonth ?? []) years.add(r._id.year);
  for (const p of analytics.profitByMonth ?? []) years.add(p._id.year);
  years.add(new Date().getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function mergeMonthlyChartRows(
  revenueByMonth: DashboardAnalytics['revenueByMonth'],
  profitByMonth: DashboardAnalytics['profitByMonth'],
  refundsByMonth?: { _id: { year: number; month: number }; refunds: number }[],
) {
  const profitMap = new Map((profitByMonth ?? []).map((p) => [monthKey(p._id.year, p._id.month), p]));
  const refundMap = new Map(
    (refundsByMonth ?? []).map((r) => [monthKey(r._id.year, r._id.month), r.refunds ?? 0]),
  );

  return revenueByMonth.map((d) => {
    const key = monthKey(d._id.year, d._id.month);
    const profit = profitMap.get(key);
    const grossRevenue = d.revenue;
    const refunds = refundMap.get(key) ?? 0;
    return {
      name: formatMonthLabel(d._id.year, d._id.month),
      year: d._id.year,
      month: d._id.month,
      grossRevenue,
      netRevenue: Math.max(0, grossRevenue - refunds),
      refunds,
      productRevenue: profit?.productRevenue ?? 0,
      grossProfit: profit?.grossProfit ?? 0,
      cogs: profit?.cogs ?? 0,
      orders: d.orders,
    };
  });
}
