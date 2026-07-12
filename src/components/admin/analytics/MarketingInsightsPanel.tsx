'use client';

import { Megaphone, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type MarketingInsights = NonNullable<DashboardAnalytics['marketingInsights']>;

function CampaignTable({
  title,
  icon: Icon,
  rows,
  valueKey,
}: {
  title: string;
  icon: typeof Megaphone;
  rows: { campaign: string; orders?: number; revenue?: number; visits?: number }[];
  valueKey: 'orders' | 'visits';
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-3 text-[10px] text-gray-400 text-center">
        No ad campaign data yet
      </div>
    );
  }

  const max = Math.max(
    ...rows.map((r) => (valueKey === 'orders' ? (r.orders ?? 0) : (r.visits ?? 0))),
    1,
  );

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-brand-600" />
        <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const value = valueKey === 'orders' ? (row.orders ?? 0) : (row.visits ?? 0);
          return (
            <li key={row.campaign}>
              <div className="flex justify-between gap-2 text-[11px] mb-0.5">
                <span className="text-gray-700 truncate" title={row.campaign}>
                  {row.campaign}
                </span>
                <span className="font-bold tabular-nums text-gray-900 shrink-0">
                  {valueKey === 'orders' ?
                    `${value} · ${formatPrice(row.revenue ?? 0)}`
                  : value}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MarketingInsightsPanel({
  marketingInsights,
  visitCampaigns,
}: {
  marketingInsights?: MarketingInsights;
  visitCampaigns?: { campaign: string; visits: number }[];
}) {
  const orderRows = marketingInsights?.ordersByCampaign ?? [];
  const visitRows = visitCampaigns ?? [];
  const hasAny = orderRows.length > 0 || visitRows.length > 0;

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-center">
        <Megaphone className="h-6 w-6 text-gray-300 mx-auto mb-1.5" />
        <p className="text-xs text-gray-600 font-medium">Meta / UTM campaign data builds after ad clicks</p>
        <p className="text-[10px] text-gray-400 mt-1">
          Add URL parameters in Meta Ads Manager · orders from those visits show here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-brand-50/40 to-white p-3 shadow-sm space-y-2">
      <div>
        <h3 className="text-sm font-bold text-gray-900">Meta &amp; ad campaigns</h3>
        <p className="text-[10px] text-gray-500">UTM tags from ad clicks · last ~30 days</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <CampaignTable
          title="Paid orders by campaign"
          icon={ShoppingBag}
          rows={orderRows}
          valueKey="orders"
        />
        <CampaignTable
          title="Ad visits by campaign"
          icon={Megaphone}
          rows={visitRows}
          valueKey="visits"
        />
      </div>
    </div>
  );
}
