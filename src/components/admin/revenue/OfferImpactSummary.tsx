'use client';

import { formatPrice } from '@/lib/utils';
import { LeakCard } from '@/components/admin/revenue/LeakCard';
import type { FinancialSnapshot } from '@/lib/revenueMetrics';

type PopupStats = {
  impressions: number;
  ctaClicks: number;
  ordersAfterPopup: number;
  revenueAfterPopup: number;
};

type Props = {
  fin: FinancialSnapshot;
  popup?: PopupStats;
  periodLabel?: string;
};

/** Compact offer breakdown for Financial Overview — all 3 systems + popup funnel. */
export default function OfferImpactSummary({ fin, popup, periodLabel }: Props) {
  const hasAny =
    fin.saleDiscounts > 0 ||
    fin.promotionDiscounts > 0 ||
    fin.couponDiscounts > 0 ||
    (popup?.impressions ?? 0) > 0;

  return (
    <section className="rounded-[1.5rem] border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900">Offer impact — sales · auto · coupons · popup</h3>
        <p className="text-xs text-gray-500 mt-1">
          {periodLabel ?? 'Selected period'} — all merchandising systems, not popup alone.
          Sale savings are already in product line prices; auto offers &amp; coupons reduce checkout total.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LeakCard
          label="Admin sales"
          value={formatPrice(fin.saleDiscounts)}
          sub="Catalog price cut (in line prices)"
          tone="amber"
        />
        <LeakCard
          label="Auto offers"
          value={formatPrice(fin.promotionDiscounts)}
          sub="Cart promotions (no code)"
          tone="red"
        />
        <LeakCard
          label="Coupon codes"
          value={formatPrice(fin.couponDiscounts)}
          sub="Checkout code discount"
          tone="red"
        />
        <LeakCard
          label="Popup opens"
          value={String(popup?.impressions ?? 0)}
          sub={
            (popup?.ordersAfterPopup ?? 0) > 0
              ? `${popup!.ordersAfterPopup} orders · ${formatPrice(popup!.revenueAfterPopup)}`
              : 'Visit modal impressions'
          }
        />
      </div>

      {!hasAny ? (
        <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          No offer data yet for this period. Place a test order with a sale, auto offer, or coupon — new
          orders store the full breakdown.
        </p>
      ) : null}
    </section>
  );
}
