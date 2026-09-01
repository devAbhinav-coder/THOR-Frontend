"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Tag } from "lucide-react";
import type {
  Coupon,
  ProductCoupon,
  ProductNearEligibleCoupon,
  ProductNearEligiblePromotion,
  ProductPromotion,
} from "@/types";
import { couponApi } from "@/lib/api";
import { couponDiscountShort, couponPrimaryLine } from "@/lib/couponDisplay";
import {
  mergeProductPromotionsForTicker,
  promotionTickerHeadline,
  promotionTickerSubline,
} from "@/lib/promotionDisplay";
import { cn } from "@/lib/utils";

type OfferSlide = {
  key: string;
  kind: "promotion" | "coupon" | "near-coupon";
  headline: string;
  subline?: string;
};

type PdpOfferTickerProps = {
  promotions?: ProductPromotion[];
  nearEligiblePromotions?: ProductNearEligiblePromotion[];
  coupons?: ProductCoupon[];
  nearEligibleCoupons?: ProductNearEligibleCoupon[];
  productId?: string;
  unitPrice?: number;
  quantity?: number;
  isAuthenticated?: boolean;
  className?: string;
  intervalMs?: number;
};

function mapEligibleCoupon(coupon: Coupon): ProductCoupon {
  return {
    code: coupon.code,
    displayTitle: coupon.displayTitle?.trim() || coupon.code,
    label: couponPrimaryLine(coupon),
    savingsLabel: couponDiscountShort(coupon),
    description: coupon.description,
  };
}

function couponSubline(
  coupon: ProductCoupon,
  hintMessage?: string,
): string | undefined {
  const desc = coupon.description?.trim();
  const savings = coupon.savingsLabel?.trim();
  const base =
    desc && savings && desc !== savings ?
      `${desc} · ${savings}`
    : desc || savings || coupon.label;
  if (hintMessage?.trim()) {
    return base ? `${hintMessage.trim()} · ${base}` : hintMessage.trim();
  }
  return base;
}

function buildSlides(
  promotions: ProductPromotion[],
  nearEligiblePromotions: ProductNearEligiblePromotion[],
  coupons: ProductCoupon[],
  nearEligibleCoupons: ProductNearEligibleCoupon[],
): OfferSlide[] {
  const allPromos = mergeProductPromotionsForTicker(
    promotions,
    nearEligiblePromotions,
  );

  const promoSlides: OfferSlide[] = allPromos.map((promo) => ({
    key: `promo-${promo.displayTitle}-${promo.label}-${promo.progressHint || promo.hintMessage || "live"}`,
    kind: "promotion",
    headline: promotionTickerHeadline(promo),
    subline: promotionTickerSubline(promo),
  }));

  const couponSlides: OfferSlide[] = coupons.map((coupon) => ({
    key: `coupon-${coupon.code}`,
    kind: "coupon",
    headline: coupon.code,
    subline: couponSubline(coupon),
  }));

  const nearSlides: OfferSlide[] = nearEligibleCoupons.map((coupon) => ({
    key: `near-${coupon.code}`,
    kind: "near-coupon",
    headline: coupon.code,
    subline: couponSubline(coupon, coupon.hintMessage),
  }));

  return [...promoSlides, ...couponSlides, ...nearSlides];
}

export function PdpOfferTicker({
  promotions = [],
  nearEligiblePromotions = [],
  coupons = [],
  nearEligibleCoupons = [],
  productId,
  unitPrice = 0,
  quantity = 1,
  isAuthenticated = false,
  className,
  intervalMs = 4000,
}: PdpOfferTickerProps) {
  const [authCoupons, setAuthCoupons] = useState<ProductCoupon[] | null>(null);
  const [authNearEligible, setAuthNearEligible] = useState<
    ProductNearEligibleCoupon[] | null
  >(null);
  const [authOffersReady, setAuthOffersReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !productId || unitPrice <= 0) {
      setAuthCoupons(null);
      setAuthNearEligible(null);
      setAuthOffersReady(true);
      return;
    }

    setAuthOffersReady(false);
    let cancelled = false;

    couponApi
      .getEligible(unitPrice * Math.max(1, quantity), [
        {
          productId,
          price: unitPrice,
          quantity: Math.max(1, quantity),
        },
      ])
      .then((res) => {
        if (cancelled) return;
        const eligibleList = res.data?.coupons;
        const nearList = res.data?.nearEligible;
        setAuthCoupons(
          Array.isArray(eligibleList) ?
            (eligibleList as Coupon[]).map(mapEligibleCoupon)
          : [],
        );
        setAuthNearEligible(
          Array.isArray(nearList) ?
            nearList.map((entry) => ({
              ...mapEligibleCoupon(entry.coupon as Coupon),
              hintMessage: entry.hintMessage,
            }))
          : [],
        );
      })
      .catch(() => {
        if (cancelled) return;
        setAuthCoupons([]);
        setAuthNearEligible([]);
      })
      .finally(() => {
        if (!cancelled) setAuthOffersReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, productId, unitPrice, quantity]);

  const displayCoupons =
    isAuthenticated && authOffersReady && authCoupons !== null ?
      authCoupons
    : coupons;
  const displayNearEligible =
    isAuthenticated && authOffersReady && authNearEligible !== null ?
      authNearEligible
    : nearEligibleCoupons;

  const slides = useMemo(
    () =>
      buildSlides(
        promotions,
        nearEligiblePromotions,
        displayCoupons,
        displayNearEligible,
      ),
    [promotions, nearEligiblePromotions, displayCoupons, displayNearEligible],
  );

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIndex((current) =>
      slides.length === 0 ? 0 : Math.min(current, slides.length - 1),
    );
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setVisible(true);
      }, 220);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!authOffersReady && slides.length === 0) return null;
  if (slides.length === 0) return null;

  const slide = slides[index]!;
  const isAutoOffer = slide.kind === "promotion";
  const Icon = isAutoOffer ? Sparkles : Tag;
  const badgeLabel =
    isAutoOffer ? "Offer"
    : slide.kind === "near-coupon" ? "Unlock"
    : "Coupon";

  return (
    <aside
      className={cn("relative shrink-0 w-[168px] sm:w-[240px]", className)}
      aria-live='polite'
      aria-label='Available offers'
    >
      <div className='flex h-[88px] flex-col rounded-xl border border-[#c5a059]/25 bg-gradient-to-br from-[#fffdf8] to-[#faf6ee] px-3 pt-2  shadow-sm'>
        <div className='mb-1 flex h-4 shrink-0 items-center justify-between gap-1'>
          <span className='inline-flex min-w-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a6d3b]'>
            <Icon className='h-3 w-3 shrink-0' strokeWidth={1.75} aria-hidden />
            <span className='truncate'>{badgeLabel}</span>
          </span>
          {slides.length > 1 ?
            <span className='shrink-0 text-[9px] font-medium tabular-nums text-[#8a6d3b]/70'>
              {index + 1}/{slides.length}
            </span>
          : null}
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col justify-center transition-opacity duration-200",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          <p
            className={cn(
              "truncate font-semibold leading-tight text-navy-900",
              slide.kind === "coupon" || slide.kind === "near-coupon" ?
                "font-mono text-[13px] tracking-wide"
              : "text-sm",
            )}
          >
            {slide.headline}
          </p>
          {slide.subline ?
            <p className='mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-600'>
              {slide.subline}
            </p>
          : null}
        </div>

        <div className='mt-1 flex h-2 shrink-0 items-center justify-center gap-1'>
          {slides.length > 1 ?
            slides.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === index ? "w-3 bg-[#c5a059]" : "w-1 bg-[#c5a059]/30",
                )}
                aria-hidden
              />
            ))
          : <span className='h-1 w-1 opacity-0' aria-hidden />}
        </div>
      </div>
    </aside>
  );
}
