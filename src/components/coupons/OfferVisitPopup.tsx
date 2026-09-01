'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Copy, Check, Tag, Percent, Sparkles } from 'lucide-react';
import { couponApi, saleCampaignApi, promotionApi, storefrontApi } from '@/lib/api';
import type { PublicCoupon, PublicSale, PublicPromotion } from '@/types';
import { cn } from '@/lib/utils';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { getShopSessionKey } from '@/lib/shopSession';
import toast from 'react-hot-toast';

/** Session: which offer keys already dismissed this tab */
const SEEN_KEY = 'hor_offer_popup_seen_v4';

type OfferKind = 'coupon' | 'sale' | 'promotion';

type ActiveOffer =
  | { kind: 'coupon'; key: string; data: PublicCoupon }
  | { kind: 'sale'; key: string; data: PublicSale }
  | { kind: 'promotion'; key: string; data: PublicPromotion };

function saleDiscountLabel(type: 'percentage' | 'flat' | 'fixed', value: number) {
  if (type === 'percentage') return `${value}% OFF`;
  if (type === 'fixed') return `At ₹${value}`;
  return `₹${value} OFF`;
}

function offerKey(kind: OfferKind, id: string) {
  return `${kind}:${id}`;
}

function buildOfferQueue(
  coupons: PublicCoupon[],
  sales: PublicSale[],
  promotions: PublicPromotion[],
): ActiveOffer[] {
  const saleOffers: ActiveOffer[] = sales.map((data, i) => ({
    kind: 'sale' as const,
    key: offerKey('sale', data._id || `${data.name}|${data.startDate}|${i}`),
    data,
  }));
  const promoOffers: ActiveOffer[] = promotions.map((data) => ({
    kind: 'promotion' as const,
    key: offerKey('promotion', data._id),
    data,
  }));
  const couponOffers: ActiveOffer[] = coupons.map((data) => ({
    kind: 'coupon' as const,
    key: offerKey('coupon', data.code),
    data,
  }));

  const withImageFirst = <T extends ActiveOffer>(list: T[]) =>
    [...list].sort((a, b) => Number(Boolean(b.data.imageUrl)) - Number(Boolean(a.data.imageUrl)));

  return [
    ...withImageFirst(saleOffers),
    ...withImageFirst(promoOffers),
    ...withImageFirst(couponOffers),
  ];
}

function readSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    /* ignore */
  }
}

function offerMeta(offer: ActiveOffer): {
  offerId?: string;
  offerLabel: string;
} {
  if (offer.kind === 'coupon') {
    return {
      offerId: offer.data.code,
      offerLabel: offer.data.displayTitle || offer.data.code || 'Coupon',
    };
  }
  if (offer.kind === 'promotion') {
    return {
      offerId: offer.data._id,
      offerLabel: offer.data.displayTitle || offer.data.name || offer.data.label || 'Auto offer',
    };
  }
  return {
    offerId: offer.data._id,
    offerLabel: offer.data.name || saleDiscountLabel(offer.data.discountType, offer.data.discountValue),
  };
}

function trackOfferEvent(
  offer: ActiveOffer,
  eventType: 'popup_impression' | 'popup_dismiss' | 'popup_cta_click' | 'coupon_copy',
) {
  const sessionKey = getShopSessionKey();
  if (!sessionKey) return;
  const meta = offerMeta(offer);
  storefrontApi
    .recordOfferEvent({
      eventType,
      offerKind: offer.kind,
      offerId: meta.offerId,
      offerLabel: meta.offerLabel,
      sessionKey,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
    .catch(() => {});
}

export default function OfferVisitPopup() {
  const [queue, setQueue] = useState<ActiveOffer[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const advancingRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());

  const offer = queue[index] ?? null;
  const total = queue.length;
  const position = index + 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  const showCurrent = useCallback(() => {
    setOpen(true);
    setCopied(false);
    setVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  const impressionSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !offer) return;
    if (impressionSentRef.current === offer.key) return;
    impressionSentRef.current = offer.key;
    trackOfferEvent(offer, 'popup_impression');
  }, [open, offer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    seenRef.current = readSeen();

    let cancelled = false;
    const timer = window.setTimeout(() => {
      Promise.all([
        couponApi.getPublic().catch(() => null),
        saleCampaignApi.getPublic().catch(() => null),
        promotionApi.getPublic().catch(() => null),
      ]).then(([couponRes, saleRes, promoRes]) => {
        if (cancelled) return;
        const coupons = Array.isArray(couponRes?.data?.coupons)
          ? (couponRes!.data.coupons as PublicCoupon[])
          : [];
        const sales = Array.isArray(saleRes?.data?.campaigns)
          ? (saleRes!.data.campaigns as PublicSale[])
          : [];
        const promotions = Array.isArray(promoRes?.data?.promotions)
          ? (promoRes!.data.promotions as PublicPromotion[])
          : [];

        const all = buildOfferQueue(coupons, sales, promotions);
        const remaining = all.filter((o) => !seenRef.current.has(o.key));
        if (!remaining.length) return;

        setQueue(remaining);
        setIndex(0);
        showCurrent();
      });
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showCurrent]);

  const markSeen = useCallback((key: string) => {
    seenRef.current.add(key);
    writeSeen(seenRef.current);
  }, []);

  const dismiss = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const current = queue[index];
    if (current) {
      markSeen(current.key);
      trackOfferEvent(current, 'popup_dismiss');
    }

    setVisible(false);

    window.setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex < queue.length) {
        setIndex(nextIndex);
        setOpen(true);
        setCopied(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setVisible(true);
            advancingRef.current = false;
          });
        });
      } else {
        setOpen(false);
        advancingRef.current = false;
      }
    }, 260);
  }, [queue, index, markSeen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockBodyScroll();
    };
  }, [open, dismiss]);

  const copyCode = async () => {
    if (!offer || offer.kind !== 'coupon') return;
    try {
      await navigator.clipboard.writeText(offer.data.code);
      setCopied(true);
      trackOfferEvent(offer, 'coupon_copy');
      toast.success('Code copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  if (!mounted || !open || !offer) return null;

  const imageUrl = offer.data.imageUrl;
  const label =
    offer.kind === 'promotion'
      ? offer.data.label
      : saleDiscountLabel(offer.data.discountType, offer.data.discountValue);

  const title =
    offer.kind === 'coupon'
      ? (offer.data.displayTitle || offer.data.code || label).trim()
      : offer.kind === 'promotion'
        ? (offer.data.displayTitle || offer.data.name || label).trim()
        : (offer.data.name || label).trim();

  const rawDescription = (offer.data.description || '').trim();
  const description =
    rawDescription && rawDescription.toLowerCase() !== title.toLowerCase()
      ? rawDescription
      : '';

  const terms =
    offer.kind === 'promotion' ? (offer.data.termsAndConditions || '').trim() : '';

  const badge =
    offer.kind === 'sale'
      ? offer.data.badgeText || 'Sale'
      : offer.kind === 'promotion'
        ? offer.data.badgeText || 'Auto offer'
        : 'Coupon code';

  const ariaLabel =
    offer.kind === 'sale' ? 'Sale offer' : offer.kind === 'promotion' ? 'Auto offer' : 'Coupon offer';

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Close offer"
        className={cn(
          'absolute inset-0 bg-navy-950/55 backdrop-blur-[6px] transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={dismiss}
      />

      <div
        className={cn(
          'relative z-[1] flex flex-col w-full sm:max-w-[420px] max-h-[80vh] sm:max-h-[90vh] overflow-hidden',
          'rounded-t-2xl sm:rounded-3xl bg-white shadow-2xl shadow-navy-950/30',
          'transition-all duration-300 ease-out will-change-transform',
          visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-4 opacity-0 scale-[0.96]',
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {total > 1 ? (
          <p className="absolute left-3 top-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
            {position} / {total}
          </p>
        ) : null}

        <div className="relative w-full shrink aspect-[4/5] sm:aspect-[4/3] max-h-[45vh] sm:max-h-[50vh] bg-navy-900 border-b border-gray-100 min-h-[120px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out',
                visible ? 'scale-100' : 'scale-105',
              )}
            />
          ) : (
            <div
              className={cn(
                'absolute inset-0',
                offer.kind === 'promotion'
                  ? 'bg-gradient-to-br from-[#8a6d3b] via-navy-900 to-brand-800'
                  : 'bg-gradient-to-br from-navy-900 via-brand-800 to-navy-800',
              )}
            />
          )}
          {/* Subtle top gradient so the close button / page indicator is legible without making the image dark */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        </div>

        <div className="flex flex-col bg-white p-4 sm:p-6 text-left shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className="flex items-center gap-1 sm:gap-1.5 rounded border border-brand-200 bg-brand-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-700">
              {offer.kind === 'sale' ? (
                <Percent className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : offer.kind === 'promotion' ? (
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
              {badge}
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-navy-600 bg-gray-50 border border-gray-200 rounded px-2 sm:px-2.5 py-0.5 sm:py-1">
              {label}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight tracking-tight mt-0.5 sm:mt-1">
            {title}
          </h2>
          
          {description ? (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-relaxed text-gray-500 line-clamp-2 sm:line-clamp-3">
              {description}
            </p>
          ) : null}

          {offer.kind === 'coupon' && offer.data.minOrderAmount ? (
            <p className="mt-1 sm:mt-2 text-[11px] sm:text-xs font-semibold text-gray-500">
              Min. Order: ₹{offer.data.minOrderAmount}
            </p>
          ) : null}
          {offer.kind === 'promotion' ? (
            <p className="mt-1 sm:mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-600">
              <Check className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.5} /> Auto-applies at checkout
            </p>
          ) : null}

          {terms ? (
             <p className="mt-2.5 sm:mt-4 text-[9px] sm:text-[10px] leading-relaxed text-gray-400 border-t border-gray-100 pt-2 sm:pt-3">
               <span className="font-semibold text-gray-500">T&amp;C: </span>
               {terms}
             </p>
          ) : null}

          <div className="mt-3 sm:mt-5 space-y-2 sm:space-y-3">
            {offer.kind === 'coupon' ? (
              <button
                type="button"
                onClick={copyCode}
                className={cn(
                  'relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-2 sm:p-3 pl-3 sm:pl-4',
                  'transition hover:bg-brand-50 hover:border-brand-400 active:scale-[0.98]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                )}
              >
                <div className="flex flex-col items-start justify-center pt-0.5">
                  <span className="font-mono text-lg sm:text-2xl font-bold tracking-widest text-brand-700 leading-none">
                    {offer.data.code}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-brand-600 mt-1">
                    Tap to copy code
                  </span>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors shadow-sm',
                    copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-brand-600 text-white shadow-brand-600/20',
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.5} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Copy Code</span><span className="sm:hidden">Copy</span>
                    </>
                  )}
                </span>
                
                {/* little circular cutouts for coupon realism */}
                <div className="absolute -left-2 top-1/2 h-3 sm:h-4 w-3 sm:w-4 -translate-y-1/2 rounded-full bg-white border border-r-0 border-dashed border-brand-300 hidden sm:block" />
              </button>
            ) : (
              <Link
                href="/shop"
                onClick={() => {
                  trackOfferEvent(offer, 'popup_cta_click');
                  dismiss();
                }}
                className={cn(
                  'flex w-full items-center justify-center rounded-xl px-4 py-2.5 sm:py-3.5',
                  'text-xs sm:text-sm font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-[0.98]',
                  offer.kind === 'promotion' ? 'bg-navy-900 hover:bg-navy-800' : 'bg-brand-600 hover:bg-brand-700',
                )}
              >
                {offer.kind === 'promotion' ? 'Shop Now' : 'Shop The Sale'}
              </Link>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="w-full pt-1 pb-0 sm:py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              {index + 1 < total ? 'View next offer' : 'Maybe later'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
