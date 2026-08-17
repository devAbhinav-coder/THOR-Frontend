'use client';

import Link from 'next/link';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Store,
  Package,
  Percent,
  ArrowRight,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { FinancialSnapshot } from '@/lib/revenueMetrics';
import type { RevenuePeriodSummary } from '@/lib/revenuePeriod';
import type { DashboardAnalytics } from '@/types';

export interface RevenueInsight {
  id: string;
  tone: 'opportunity' | 'warning' | 'info';
  title: string;
  body: string;
  action?: { label: string; href: string };
}

function buildInsights(
  fin: FinancialSnapshot,
  period: RevenuePeriodSummary | null,
  analytics: DashboardAnalytics | null,
): RevenueInsight[] {
  const insights: RevenueInsight[] = [];
  const channel = period?.channelMix;
  const offlineShare =
    channel &&
    channel.onlineRevenue + channel.offlineRevenue + (channel.b2bRevenue ?? 0) > 0 ?
      channel.offlineRevenue /
        (channel.onlineRevenue + channel.offlineRevenue + (channel.b2bRevenue ?? 0))
    : 0;

  if (channel && channel.offlineCount > 0) {
    insights.push({
      id: 'offline-tracked',
      tone: 'info',
      title: 'Offline / POS sales included',
      body: `${channel.offlineCount} offline orders (${formatPrice(channel.offlineRevenue)}) are in this period — same as website checkout. Catalog stock & soldCount update for catalog lines.`,
      action: { label: 'Record offline sale', href: '/admin/orders/offline' },
    });
  }

  if (offlineShare >= 0.25 && channel) {
    insights.push({
      id: 'offline-strong',
      tone: 'opportunity',
      title: 'Strong offline channel',
      body: `${Math.round(offlineShare * 100)}% of revenue is offline. Ensure every stall sale uses catalog lines when possible so inventory stays accurate.`,
      action: { label: 'Inventory hub', href: '/admin/inventory' },
    });
  }

  if (fin.grossMarginPct > 0 && fin.grossMarginPct < 25) {
    insights.push({
      id: 'low-margin',
      tone: 'warning',
      title: 'Product margin is thin',
      body: `Gross margin is ${fin.grossMarginPct}%. Review variant costs in Inventory and consider repricing low-margin SKUs.`,
      action: { label: 'Set costs', href: '/admin/inventory?filter=missing_cost' },
    });
  }

  if (fin.couponDiscounts > 0 && fin.grossRevenue > 0) {
    const pct = Math.round((fin.couponDiscounts / fin.grossRevenue) * 100);
    if (pct >= 5) {
      insights.push({
        id: 'coupon-leak',
        tone: 'warning',
        title: 'Coupon discounts eating revenue',
        body: `${formatPrice(fin.couponDiscounts)} (${pct}% of gross) went to coupons. Tighten codes or raise minimum order value.`,
      });
    }
  }

  if (fin.promotionDiscounts > 0 && fin.grossRevenue > 0) {
    const pct = Math.round((fin.promotionDiscounts / fin.grossRevenue) * 100);
    if (pct >= 5) {
      insights.push({
        id: 'promo-leak',
        tone: 'warning',
        title: 'Auto offers reducing checkout total',
        body: `${formatPrice(fin.promotionDiscounts)} (${pct}% of gross) from auto offers. Review overlapping promotions in Admin → Auto offers.`,
        action: { label: 'Auto offers', href: '/admin/promotions' },
      });
    }
  }

  const missingCost = analytics?.overview?.profitLinesMissingCost ?? 0;
  const orderLines = analytics?.overview?.profitOrderLines ?? 0;
  if (missingCost > 0 && orderLines > 0) {
    insights.push({
      id: 'missing-cost',
      tone: 'warning',
      title: 'Profit may be overstated',
      body: `${missingCost} of ${orderLines} paid lines have no cost set. Add purchase costs or WAC via purchase bills.`,
      action: { label: 'Fix in inventory', href: '/admin/inventory' },
    });
  }

  const lowStock = analytics?.stockHealth?.lowStock ?? 0;
  const outStock = analytics?.stockHealth?.outOfStock ?? 0;
  if (lowStock + outStock > 0) {
    insights.push({
      id: 'stock-alert',
      tone: 'opportunity',
      title: 'Restock to capture demand',
      body: `${lowStock} low-stock and ${outStock} out-of-stock products. Reorder before you lose sales.`,
      action: { label: 'Reorder suggestions', href: '/admin/inventory' },
    });
  }

  if (fin.netAfterOperating < fin.netIncome && fin.operatingExpenses > 0) {
    insights.push({
      id: 'opex',
      tone: 'info',
      title: 'Operating costs reduce net',
      body: `After ${formatPrice(fin.operatingExpenses)} operating costs, net is ${formatPrice(fin.netAfterOperating)}. Log ads, packing & rent consistently.`,
      action: { label: 'Operating costs', href: '/admin/expenses' },
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'healthy',
      tone: 'opportunity',
      title: 'Metrics look healthy',
      body: 'Keep recording offline sales with catalog SKUs, maintain costs, and compare month vs year in the toolbar above.',
    });
  }

  return insights.slice(0, 6);
}

const toneStyles = {
  opportunity: 'border-emerald-200 bg-emerald-50/60',
  warning: 'border-amber-200 bg-amber-50/70',
  info: 'border-brand-200 bg-brand-50/50',
};

const toneIcon = {
  opportunity: TrendingUp,
  warning: AlertTriangle,
  info: Store,
};

export default function RevenueInsightsPanel({
  fin,
  period,
  analytics,
}: {
  fin: FinancialSnapshot;
  period: RevenuePeriodSummary | null;
  analytics: DashboardAnalytics | null;
}) {
  const insights = buildInsights(fin, period, analytics);

  return (
    <section className="rounded-[1.5rem] border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900">What you can do next</h3>
        <span className="text-[10px] text-gray-400 ml-auto">Based on this period</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {insights.map((item) => {
          const Icon = toneIcon[item.tone];
          return (
            <li
              key={item.id}
              className={cn('px-5 py-3.5 flex gap-3', toneStyles[item.tone])}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5 text-gray-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.body}</p>
                {item.action && (
                  <Link
                    href={item.action.href}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 mt-2 hover:underline"
                  >
                    {item.action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span className="inline-flex items-center gap-1">
          <Package className="h-3 w-3" /> Offline catalog lines → inventory
        </span>
        <span className="inline-flex items-center gap-1">
          <Percent className="h-3 w-3" /> Manual category lines → category profit
        </span>
      </div>
    </section>
  );
}
