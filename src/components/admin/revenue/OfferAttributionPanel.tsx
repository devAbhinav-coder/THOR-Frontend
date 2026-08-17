'use client';

import { formatPrice } from '@/lib/utils';
import { LeakCard } from '@/components/admin/revenue/LeakCard';
import type { RevenuePeriodSummary } from '@/lib/revenuePeriod';

type Props = {
  attribution?: RevenuePeriodSummary['offerAttribution'];
  periodLabel?: string;
  /** Fallback totals from period overview when attribution nested object is empty. */
  overview?: {
    saleDiscountTotal?: number;
    saleOrdersCount?: number;
    promotionDiscountTotal?: number;
    promotionOrdersCount?: number;
    couponDiscountTotal?: number;
    couponOrdersCount?: number;
  };
};

export default function OfferAttributionPanel({ attribution, periodLabel, overview }: Props) {
  if (!attribution && !overview) return null;

  const sales = {
    discountTotal: attribution?.sales.discountTotal ?? overview?.saleDiscountTotal ?? 0,
    ordersCount: attribution?.sales.ordersCount ?? overview?.saleOrdersCount ?? 0,
  };
  const promotions = {
    discountTotal: attribution?.promotions.discountTotal ?? overview?.promotionDiscountTotal ?? 0,
    ordersCount: attribution?.promotions.ordersCount ?? overview?.promotionOrdersCount ?? 0,
    top: attribution?.promotions.top ?? [],
  };
  const coupons = {
    discountTotal: attribution?.coupons.discountTotal ?? overview?.couponDiscountTotal ?? 0,
    ordersCount: attribution?.coupons.ordersCount ?? overview?.couponOrdersCount ?? 0,
    top: attribution?.coupons.top ?? [],
  };
  const popup = attribution?.popup ?? {
    impressions: 0,
    dismisses: 0,
    ctaClicks: 0,
    couponCopies: 0,
    byKind: [],
    ordersAfterPopup: 0,
    revenueAfterPopup: 0,
  };

  const totalCheckoutDiscount = promotions.discountTotal + coupons.discountTotal;

  return (
    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          All offers · sales · auto · coupons · popup · {periodLabel ?? 'period'}
        </h3>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          <strong>Sales</strong> = catalog price cut · <strong>Auto offers</strong> = cart promotions ·{' '}
          <strong>Coupons</strong> = codes · <strong>Popup</strong> = visit modal funnel (separate from order discounts).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LeakCard
          label="Sale savings (catalog)"
          value={formatPrice(sales.discountTotal)}
          sub={`${sales.ordersCount} orders on sale pricing`}
          tone="amber"
        />
        <LeakCard
          label="Auto offers"
          value={formatPrice(promotions.discountTotal)}
          sub={`${promotions.ordersCount} orders`}
          tone="red"
        />
        <LeakCard
          label="Coupon codes"
          value={formatPrice(coupons.discountTotal)}
          sub={`${coupons.ordersCount} orders`}
          tone="red"
        />
        <LeakCard
          label="Checkout discounts"
          value={formatPrice(totalCheckoutDiscount)}
          sub="Auto offers + coupons"
          tone="red"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
        <LeakCard label="Popup opens" value={String(popup.impressions)} />
        <LeakCard label="Popup CTA clicks" value={String(popup.ctaClicks)} />
        <LeakCard
          label="Orders after popup"
          value={String(popup.ordersAfterPopup)}
          sub={popup.revenueAfterPopup > 0 ? formatPrice(popup.revenueAfterPopup) : undefined}
          tone="emerald"
        />
        <LeakCard label="Coupon copies" value={String(popup.couponCopies)} />
      </div>

      {(promotions.top.length > 0 || coupons.top.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          {promotions.top.length > 0 ? (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Top auto offers</p>
              <ul className="space-y-1.5">
                {promotions.top.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between text-xs text-gray-600"
                  >
                    <span className="truncate pr-2">{row.name}</span>
                    <span className="font-semibold text-gray-800 shrink-0">
                      {formatPrice(row.discountTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {coupons.top.length > 0 ? (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Top coupon codes</p>
              <ul className="space-y-1.5">
                {coupons.top.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between text-xs text-gray-600"
                  >
                    <span className="font-mono truncate pr-2">{row.code}</span>
                    <span className="font-semibold text-gray-800 shrink-0">
                      {formatPrice(row.discountTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
