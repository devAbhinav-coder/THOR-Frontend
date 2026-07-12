import type { DashboardAnalytics } from '@/types';



export type FinancialSnapshot = {

  grossRevenue: number;

  refunds: number;

  netRevenue: number;

  productRevenue: number;

  cogs: number;

  grossProfit: number;

  grossMarginPct: number;

  shippingFees: number;

  codFees: number;

  feesRetained: number;

  couponDiscounts: number;

  operatingExpenses: number;

  netIncome: number;

  netIncomeMarginPct: number;

  netAfterOperating: number;

};



export type RevenueOverviewInput = Partial<DashboardAnalytics['overview']> & {
  grossRevenue?: number;
  netRevenue?: number;
  refunds?: number;
  cogs?: number;
  couponOrdersCount?: number;
};



/** Single source of truth for revenue page labels and formulas. */

export function buildFinancialSnapshot(

  overview: RevenueOverviewInput,

  refunded: number,

  feesRetained: number,

  operatingExpenses = 0,

  options?: { usePeriodFields?: boolean },

): FinancialSnapshot {

  const usePeriod = options?.usePeriodFields === true;



  const grossRevenue = usePeriod && overview.grossRevenue != null

    ? overview.grossRevenue

    : overview.totalRevenue ?? overview.grossRevenue ?? 0;

  const refunds = usePeriod && overview.refunds != null ? overview.refunds : (refunded ?? 0);

  const netRevenue =

    usePeriod && overview.netRevenue != null

      ? overview.netRevenue

      : Math.max(0, grossRevenue - refunds);

  const productRevenue = usePeriod && overview.productRevenue != null

    ? overview.productRevenue

    : overview.productRevenue ?? 0;

  const cogs = usePeriod && overview.cogs != null ? overview.cogs : overview.productCogs ?? overview.cogs ?? 0;

  const grossProfit = usePeriod && overview.grossProfit != null

    ? overview.grossProfit

    : overview.grossProfit ?? 0;

  const grossMarginPct =

    (usePeriod ? overview.grossMarginPercent : overview.grossMarginPercent) ??

    (productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0);



  const shippingFees = overview.shippingCollected ?? 0;

  const codFees = overview.codFeeCollected ?? 0;

  const couponDiscounts = overview.couponDiscountTotal ?? 0;

  const fees = feesRetained ?? overview.nonRefundableFeesRetained ?? 0;

  const ancillary = shippingFees + codFees + fees;

  const netIncome = Math.max(0, grossProfit + ancillary - couponDiscounts);

  const opex = operatingExpenses ?? 0;

  const netAfterOperating = netIncome - opex;

  const netIncomeMarginPct = productRevenue > 0 ? (netIncome / productRevenue) * 100 : 0;



  return {

    grossRevenue,

    refunds,

    netRevenue,

    productRevenue,

    cogs,

    grossProfit,

    grossMarginPct,

    shippingFees,

    codFees,

    feesRetained: fees,

    couponDiscounts,

    operatingExpenses: opex,

    netIncome,

    netIncomeMarginPct: Math.round(netIncomeMarginPct * 10) / 10,

    netAfterOperating,

  };

}

/** Revenue growth badge + subtitle for admin dashboards. */
export function formatRevenueGrowthSub(
  growth: number | null | undefined,
  monthRevenue = 0,
): string {
  if (growth === null || growth === undefined) {
    return monthRevenue > 0 ? 'New — no last month to compare' : 'No revenue this month';
  }
  if (growth === 0 && monthRevenue === 0) return 'No revenue this month';
  return `${growth >= 0 ? '+' : ''}${growth}% vs last month`;
}

/** Only show growth badge when there is a real month-over-month baseline. */
export function revenueGrowthBadgeValue(
  growth: number | null | undefined,
): number | undefined {
  if (growth === null || growth === undefined) return undefined;
  return growth;
}


