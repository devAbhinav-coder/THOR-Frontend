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
  netIncome: number;
  netIncomeMarginPct: number;
};

/** Single source of truth for revenue page labels and formulas. */
export function buildFinancialSnapshot(
  overview: DashboardAnalytics['overview'],
  refunded: number,
  feesRetained: number,
): FinancialSnapshot {
  const grossRevenue = overview.totalRevenue ?? 0;
  const refunds = refunded ?? 0;
  const netRevenue = Math.max(0, grossRevenue - refunds);
  const productRevenue = overview.productRevenue ?? 0;
  const cogs = overview.productCogs ?? 0;
  const grossProfit = overview.grossProfit ?? 0;
  const grossMarginPct = overview.grossMarginPercent ?? (productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0);
  const shippingFees = overview.shippingCollected ?? 0;
  const codFees = overview.codFeeCollected ?? 0;
  const couponDiscounts = overview.couponDiscountTotal ?? 0;
  const ancillary = shippingFees + codFees + feesRetained;
  const netIncome = Math.max(0, grossProfit + ancillary - couponDiscounts);
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
    feesRetained,
    couponDiscounts,
    netIncome,
    netIncomeMarginPct: Math.round(netIncomeMarginPct * 10) / 10,
  };
}
