"use client";

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Megaphone,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";
import AdAttributionDetailTable from "./AdAttributionDetailTable";
import MarketingPerformanceBlock from "./MarketingPerformanceBlock";
import MarketingAdSummaryCards from "./MarketingAdSummaryCards";

type MarketingInsights = NonNullable<DashboardAnalytics["marketingInsights"]>;

const META_EVENTS_MANAGER_URL = "https://business.facebook.com/events_manager";
const META_COMMERCE_MANAGER_URL =
  "https://business.facebook.com/commerce/catalogs";

function copyFeedUrl(path: string) {
  if (typeof window === "undefined") return;
  const url = `${window.location.origin}${path}`;
  void navigator.clipboard?.writeText(url);
  toast.success("Copied Meta catalog feed URL");
}

const PIXEL_EVENTS = [
  { name: "PageView", where: "Every page load & route change" },
  { name: "ViewContent", where: "Shop + Premium PDP (variant SKU & sell price)" },
  { name: "Search", where: "Header nav + voice + shop filters (deduped)" },
  { name: "AddToCart", where: "PDP, cards, gift, wishlist, cart qty +" },
  { name: "AddToWishlist", where: "Heart on PDP & cards (variant SKU)" },
  {
    name: "InitiateCheckout",
    where: "Checkout with cart content_ids + value",
  },
  {
    name: "AddPaymentInfo",
    where: "Payment step (value + cart lines + address match)",
  },
  { name: "CompleteRegistration", where: "Account signup verify" },
  { name: "Contact", where: "WhatsApp / email on Connect" },
  { name: "Purchase", where: "Browser + server CAPI (order_id, SKU lines)" },
] as const;

const CATALOG_FEED_FIELDS = [
  "Variant id = SKU (matches pixel content_ids)",
  "item_group_id = product Mongo id",
  "Premium → /premium/slug · Shop → /shop/slug?color=",
  "Per-variant image + up to 10 additional_image_link",
  "price / sale_price, availability, brand, condition",
  "gender, age_group, product_type, google category 2271",
  "identifier_exists false (no GTIN)",
  "Inactive products excluded",
] as const;

const MATCH_PARAMS = [
  { label: "IP + User agent", note: "Every CAPI event" },
  { label: "Browser ID (fbp)", note: "Pixel cookie" },
  { label: "Click ID (fbc)", note: "Meta ad clicks (fbclid)" },
  { label: "Email + phone", note: "Logged-in users & checkout" },
  { label: "Name, city, pincode", note: "Checkout address" },
  { label: "External ID", note: "Logged-in customer id" },
] as const;

function StatusPill({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        on ?
          "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"
      }`}
    >
      {on ?
        <CheckCircle2 className='h-3 w-3' aria-hidden />
      : <XCircle className='h-3 w-3' aria-hidden />}
      {label}: {on ? "On" : "Off"}
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
  valueKey: "orders" | "visits";
}) {
  if (!rows.length) {
    return (
      <div className='rounded-lg border border-dashed border-gray-200 p-3 text-[10px] text-gray-400 text-center'>
        No data yet
      </div>
    );
  }

  const max = Math.max(
    ...rows.map((r) =>
      valueKey === "orders" ? (r.orders ?? 0) : (r.visits ?? 0),
    ),
    1,
  );

  return (
    <div className='rounded-lg border border-gray-100 bg-white p-2.5'>
      <div className='flex items-center gap-1.5 mb-2'>
        <Icon className='h-3.5 w-3.5 text-brand-600' />
        <h4 className='text-[10px] font-bold uppercase tracking-wide text-gray-500'>
          {title}
        </h4>
      </div>
      <ul className='space-y-1.5'>
        {rows.map((row) => {
          const value =
            valueKey === "orders" ? (row.orders ?? 0) : (row.visits ?? 0);
          return (
            <li key={row.label}>
              <div className='flex justify-between gap-2 text-[11px] mb-0.5'>
                <span className='text-gray-700 truncate' title={row.label}>
                  {row.label}
                </span>
                <span className='font-bold tabular-nums text-gray-900 shrink-0'>
                  {valueKey === "orders" ?
                    `${value} · ${formatPrice(row.revenue ?? 0)}`
                  : value}
                </span>
              </div>
              <div className='h-1 bg-gray-100 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-brand-500 rounded-full'
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
  const trackingReady = pixelOn && capiOn;

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h3 className='text-sm font-semibold text-navy-900 tracking-tight'>
            Marketing &amp; Meta
          </h3>
          <p className='text-xs text-gray-500 mt-0.5'>
            Pixel, Conversions API, and first-party UTM attribution
          </p>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          <StatusPill label='Pixel' on={pixelOn} />
          <StatusPill label='Server CAPI' on={capiOn} />
        </div>
      </div>

      <MarketingAdSummaryCards
        marketingInsights={marketingInsights}
        visitCampaigns={visitCampaigns}
      />

      <div
        className={`rounded-lg border px-2.5 py-2.5 text-[11px] leading-relaxed ${
          trackingReady ?
            "border-gray-200 bg-gray-50 text-gray-600"
          : "border-amber-200 bg-amber-50/80 text-amber-900"
        }`}
      >
        {trackingReady ?
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
            <p>
              After deploy: Events Manager → Test events. Open a product, add
              to cart, then checkout. Match quality scores refresh over 1–3
              days, not instantly.
            </p>
            <a
              href={META_EVENTS_MANAGER_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center justify-center gap-1 rounded-lg bg-navy-900 px-3 py-2 text-[10px] font-semibold text-white hover:bg-navy-800 shrink-0'
            >
              Open Events Manager
              <ExternalLink className='h-3 w-3' aria-hidden />
            </a>
          </div>
        : <p>
            {!pixelOn && !capiOn ?
              "Set NEXT_PUBLIC_META_PIXEL_ID (frontend) plus META_PIXEL_ID and META_CAPI_TOKEN (backend)."
            : !pixelOn ?
              "Frontend pixel ID is missing. Set NEXT_PUBLIC_META_PIXEL_ID."
            : "Server token is missing. Set META_CAPI_TOKEN on the backend (same pixel as the browser)."
            }
          </p>
        }
      </div>

      <MarketingPerformanceBlock marketingInsights={marketingInsights} />

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
        <CampaignTable
          title='Visits by campaign'
          icon={Megaphone}
          rows={visitRows}
          valueKey='visits'
        />
        <CampaignTable
          title='Orders by campaign'
          icon={ShoppingBag}
          rows={orderRows}
          valueKey='orders'
        />
        <CampaignTable
          title='Orders by source'
          icon={ShoppingBag}
          rows={sourceRows}
          valueKey='orders'
        />
      </div>

      <AdAttributionDetailTable
        rows={marketingInsights?.adAttributionRows}
      />

      <details className='rounded-lg border border-gray-100 bg-white'>
        <summary className='cursor-pointer list-none px-3 py-2 text-xs font-semibold text-navy-900'>
          Meta integration reference
        </summary>
        <div className='px-3 pb-3 space-y-2 border-t border-gray-50 pt-2'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
            <div className='rounded-lg border border-gray-100 bg-gray-50/50 p-2.5'>
              <h4 className='text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2'>
                Events on site
              </h4>
              <ul className='space-y-1 max-h-[200px] overflow-y-auto'>
                {PIXEL_EVENTS.map((event) => (
                  <li
                    key={event.name}
                    className='flex items-start gap-1.5 text-[11px]'
                  >
                    <CheckCircle2 className='h-3 w-3 text-emerald-600 mt-0.5 shrink-0' />
                    <span>
                      <span className='font-semibold text-gray-800'>
                        {event.name}
                      </span>
                      <span className='text-gray-500'> — {event.where}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='rounded-lg border border-gray-100 bg-gray-50/50 p-2.5'>
              <h4 className='text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2'>
                Match quality (CAPI)
              </h4>
              <ul className='space-y-1'>
                {MATCH_PARAMS.map((param) => (
                  <li
                    key={param.label}
                    className='flex items-start gap-1.5 text-[11px]'
                  >
                    <Circle className='h-3 w-3 text-brand-500 mt-0.5 shrink-0 fill-brand-100' />
                    <span>
                      <span className='font-semibold text-gray-800'>
                        {param.label}
                      </span>
                      <span className='text-gray-500'> — {param.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className='rounded-lg border border-gray-100 bg-gray-50/50 px-2.5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
            <p className='text-[10px] text-gray-600'>
              Product feed:{" "}
              <code className='bg-white px-1 rounded'>/api/feed</code> · Test in
              Events Manager after deploy
            </p>
            <div className='flex flex-wrap gap-2 shrink-0'>
              <button
                type='button'
                onClick={() => copyFeedUrl("/api/feed")}
                className='rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-800 hover:bg-gray-50'
              >
                Copy feed URL
              </button>
              <a
                href={META_EVENTS_MANAGER_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 rounded-md bg-navy-900 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-navy-800'
              >
                Events Manager
                <ExternalLink className='h-3 w-3' />
              </a>
              <a
                href={META_COMMERCE_MANAGER_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-800 hover:bg-gray-50'
              >
                Commerce
                <ExternalLink className='h-3 w-3' />
              </a>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
