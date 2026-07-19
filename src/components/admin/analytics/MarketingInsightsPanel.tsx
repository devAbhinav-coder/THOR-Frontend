'use client';

import { CheckCircle2, Megaphone, ShoppingBag, XCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type MarketingInsights = NonNullable<DashboardAnalytics['marketingInsights']>;

function StatusPill({
  label,
  on,
}: {
  label: string;
  on: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        on
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200'
      }`}
    >
      {on ?
        <CheckCircle2 className="h-3 w-3" aria-hidden />
      : <XCircle className="h-3 w-3" aria-hidden />}
      {label}: {on ? 'On' : 'Off'}
    </span>
  );
}

function CampaignTable({
  title,
  icon: Icon,
  rows,
  valueKey,
}: {
  title: string;
  icon: typeof Megaphone;
  rows: { label: string; orders?: number; revenue?: number; visits?: number }[];
  valueKey: 'orders' | 'visits';
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-3 text-[10px] text-gray-400 text-center">
        No data yet
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
            <li key={row.label}>
              <div className="flex justify-between gap-2 text-[11px] mb-0.5">
                <span className="text-gray-700 truncate" title={row.label}>
                  {row.label}
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
  const orderRows = (marketingInsights?.ordersByCampaign ?? []).map((r) => ({
    label: r.campaign,
    orders: r.orders,
    revenue: r.revenue,
  }));
  const sourceRows = (marketingInsights?.ordersBySource ?? []).map((r) => ({
    label: r.source,
    orders: r.orders,
    revenue: r.revenue,
  }));
  const visitRows = (visitCampaigns ?? []).map((r) => ({
    label: r.campaign,
    visits: r.visits,
  }));

  const pixelOn = marketingInsights?.metaTracking?.pixelConfigured ?? false;
  const capiOn = marketingInsights?.metaTracking?.capiConfigured ?? false;
  const attributed = marketingInsights?.attributedOrders ?? 0;
  const metaClicks = marketingInsights?.fbclidOrders ?? 0;
  const hasTables = orderRows.length > 0 || visitRows.length > 0 || sourceRows.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-brand-50/40 to-white p-3 shadow-sm space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Meta ads</h3>
          <p className="text-[10px] text-gray-500">Last ~30 days · UTM + click tracking</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill label="Pixel" on={pixelOn} />
          <StatusPill label="Server" on={capiOn} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
          <p className="text-[10px] text-gray-500 font-medium">Ad orders</p>
          <p className="text-sm font-bold tabular-nums text-gray-900">{attributed}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
          <p className="text-[10px] text-gray-500 font-medium">Meta clicks</p>
          <p className="text-sm font-bold tabular-nums text-gray-900">{metaClicks}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
          <p className="text-[10px] text-gray-500 font-medium">Campaigns</p>
          <p className="text-sm font-bold tabular-nums text-gray-900">{orderRows.length}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
          <p className="text-[10px] text-gray-500 font-medium">Ad visits</p>
          <p className="text-sm font-bold tabular-nums text-gray-900">
            {visitRows.reduce((sum, r) => sum + (r.visits ?? 0), 0)}
          </p>
        </div>
      </div>

      {!hasTables ?
        <div className="rounded-lg border border-dashed border-gray-200 bg-white/70 p-3 text-center">
          <Megaphone className="h-5 w-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-600 font-medium">No ad orders yet</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Add UTM params in Meta Ads → clicks &amp; orders show here
          </p>
        </div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <CampaignTable
            title="Orders by campaign"
            icon={ShoppingBag}
            rows={orderRows}
            valueKey="orders"
          />
          <CampaignTable
            title="Orders by source"
            icon={ShoppingBag}
            rows={sourceRows}
            valueKey="orders"
          />
          <CampaignTable
            title="Visits by campaign"
            icon={Megaphone}
            rows={visitRows}
            valueKey="visits"
          />
        </div>
      )}
    </div>
  );
}
