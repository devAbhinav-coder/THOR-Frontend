'use client';

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Megaphone,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type MarketingInsights = NonNullable<DashboardAnalytics['marketingInsights']>;

const META_EVENTS_MANAGER_URL = 'https://business.facebook.com/events_manager';

const PIXEL_EVENTS = [
  { name: 'PageView', where: 'Every page load & route change' },
  { name: 'ViewContent', where: 'Product page' },
  { name: 'Search', where: 'Shop search' },
  { name: 'AddToCart', where: 'PDP, gift add, move-to-bag' },
  { name: 'AddToWishlist', where: 'Heart on PDP & product cards' },
  { name: 'InitiateCheckout', where: 'Checkout (with phone/email when known)' },
  { name: 'AddPaymentInfo', where: 'Checkout payment step' },
  { name: 'CompleteRegistration', where: 'Account signup verify' },
  { name: 'Contact', where: 'WhatsApp / email on Connect' },
  { name: 'Purchase', where: 'Order placed or paid (server CAPI)' },
] as const;

const MATCH_PARAMS = [
  { label: 'IP + User agent', note: 'Every CAPI event' },
  { label: 'Browser ID (fbp)', note: 'Pixel cookie' },
  { label: 'Click ID (fbc)', note: 'Meta ad clicks (fbclid)' },
  { label: 'Email + phone', note: 'Logged-in users & checkout' },
  { label: 'Name, city, pincode', note: 'Checkout address' },
  { label: 'External ID', note: 'Logged-in customer id' },
] as const;

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
  const trackingReady = pixelOn && capiOn;

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-brand-50/40 to-white p-3 shadow-sm space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Meta Pixel &amp; ads</h3>
          <p className="text-[10px] text-gray-500">
            Website pixel + Conversions API · last ~30 days UTM / click tracking
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill label="Pixel" on={pixelOn} />
          <StatusPill label="Server CAPI" on={capiOn} />
        </div>
      </div>

      <div
        className={`rounded-lg border px-2.5 py-2 text-[11px] ${
          trackingReady
            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
            : 'border-amber-200 bg-amber-50/80 text-amber-900'
        }`}
      >
        {trackingReady ?
          <p>
            Tracking is live. Browser pixel and server events use the same event IDs so Meta
            can deduplicate. Event Match Quality in Events Manager updates in 24–72 hours —
            it will not jump immediately after a deploy.
          </p>
        : (
          <p>
            {!pixelOn && !capiOn ?
              'Set NEXT_PUBLIC_META_PIXEL_ID (frontend) plus META_PIXEL_ID and META_CAPI_TOKEN (backend).'
            : !pixelOn ?
              'Frontend pixel ID is missing. Set NEXT_PUBLIC_META_PIXEL_ID.'
            : 'Server token is missing. Set META_CAPI_TOKEN on the backend (same pixel as the browser).'}
          </p>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="rounded-lg border border-gray-100 bg-white p-2.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
            Events wired on the site
          </h4>
          <ul className="space-y-1">
            {PIXEL_EVENTS.map((event) => (
              <li key={event.name} className="flex items-start gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold text-gray-800">{event.name}</span>
                  <span className="text-gray-500"> — {event.where}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-2.5 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Match quality parameters
          </h4>
          <ul className="space-y-1">
            {MATCH_PARAMS.map((param) => (
              <li key={param.label} className="flex items-start gap-1.5 text-[11px]">
                <Circle className="h-3 w-3 text-brand-500 mt-0.5 shrink-0 fill-brand-100" />
                <span>
                  <span className="font-semibold text-gray-800">{param.label}</span>
                  <span className="text-gray-500"> — {param.note}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Click ID (fbc) is high only for people who arrive from a Meta ad. Organic / direct
            traffic staying at 8–20% is normal. Email and phone raise scores most on checkout
            and logged-in sessions — guests browsing product pages will still score lower.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-[11px] text-gray-600">
          After deploy: Events Manager → Test events. Open a product, add to cart, then checkout.
          Scores refresh over 1–3 days, not instantly.
        </p>
        <a
          href={META_EVENTS_MANAGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 shrink-0 rounded-md bg-navy-900 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-navy-800"
        >
          Open Events Manager
          <ExternalLink className="h-3 w-3" />
        </a>
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
