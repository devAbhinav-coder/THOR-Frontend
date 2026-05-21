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

type PeriodOverview = {
  grossRevenue?: number;
  netRevenue?: number;
  refunds?: number;
  productRevenue?: number;
  cogs?: number;
  grossProfit?: number;
  grossMarginPercent?: number;
};

/** Single source of truth for revenue page labels and formulas. */
export function buildFinancialSnapshot(
  overview: DashboardAnalytics['overview'] | PeriodOverview,
  refunded: number,
  feesRetained: number,
  operatingExpenses = 0,
  options?: { usePeriodFields?: boolean; periodScoped?: boolean },
): FinancialSnapshot {
  const po = overview as PeriodOverview;
  const grossRevenue =
    options?.usePeriodFields && po.grossRevenue != null ? po.grossRevenue : (overview as DashboardAnalytics['overview']).totalRevenue ?? po.grossRevenue ?? 0;
  const refunds =
    options?.usePeriodFields && po.refunds != null ? po.refunds : (refunded ?? 0);
  const netRevenue =
    options?.usePeriodFields && po.netRevenue != null
      ? po.netRevenue
      : Math.max(0, grossRevenue - refunds);
  const productRevenue =
    options?.usePeriodFields && po.productRevenue != null
      ? po.productRevenue
      : (overview as DashboardAnalytics['overview']).productRevenue ?? po.productRevenue ?? 0;
  const cogs =
    options?.usePeriodFields && po.cogs != null
      ? po.cogs
      : (overview as DashboardAnalytics['overview']).productCogs ?? po.cogs ?? 0;
  const grossProfit =
    options?.usePeriodFields && po.grossProfit != null
      ? po.grossProfit
      : (overview as DashboardAnalytics['overview']).grossProfit ?? po.grossProfit ?? 0;
  const grossMarginPct =
    (options?.usePeriodFields ? po.grossMarginPercent : (overview as DashboardAnalytics['overview']).grossMarginPercent) ??
    (productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0);
  const full = overview as DashboardAnalytics['overview'];
  const periodScoped = options?.periodScoped === true;
  const shippingFees = periodScoped ? 0 : (full.shippingCollected ?? 0);
  const codFees = periodScoped ? 0 : (full.codFeeCollected ?? 0);
  const couponDiscounts = periodScoped ? 0 : (full.couponDiscountTotal ?? 0);
  const fees = periodScoped ? 0 : feesRetained;
  const ancillary = shippingFees + codFees + fees;
  const netIncome = periodScoped
    ? grossProfit
    : Math.max(0, grossProfit + ancillary - couponDiscounts);
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
