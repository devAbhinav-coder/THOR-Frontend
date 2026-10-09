'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Copy, Check, Tag, Percent, Sparkles, ArrowRight } from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import type { PublicCoupon, PublicSale, PublicPromotion } from '@/types';
import { cn } from '@/lib/utils';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { getShopSessionKey } from '@/lib/shopSession';
import toast from 'react-hot-toast';
import { SHOP_SALE_HREF } from '@/lib/shopSpecialCollections';
import {
  resolveVisitPopupTextColor,
  resolveVisitPopupTextStyle,
  visitPopupOverlayText,
  visitPopupTextStyle,
  visitPopupTypography,
} from '@/lib/visitPopupOverlay';

/** Session: which offer keys already dismissed this tab */
const SEEN_KEY = 'hor_offer_popup_seen_v4';
const AUTO_SLIDE_MS = 3000;
const SWIPE_THRESHOLD_PX = 44;

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

function getOfferCopy(offer: ActiveOffer) {
  const imageUrl = offer.data.imageUrl?.trim() || '';
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

  const overlayLine = visitPopupOverlayText(offer.data.visitPopupOverlayText);
  const textColor = resolveVisitPopupTextColor(offer.data.visitPopupTextColor);
  const textStyle = resolveVisitPopupTextStyle(offer.data.visitPopupTextStyle);
  const typo = visitPopupTypography(textStyle);

  return {
    imageUrl,
    label,
    title,
    description,
    terms,
    badge,
    ariaLabel,
    overlayLine,
    textColor,
    textStyle,
    typo,
  };
}

export default function OfferVisitPopup() {
  const [queue, setQueue] = useState<ActiveOffer[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const impressionSentRef = useRef<Set<string>>(new Set());
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeTrackingRef = useRef(false);

  const offer = queue[index] ?? null;
  const total = queue.length;

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

  const trackImpression = useCallback((item: ActiveOffer) => {
    if (impressionSentRef.current.has(item.key)) return;
    impressionSentRef.current.add(item.key);
    trackOfferEvent(item, 'popup_impression');
  }, []);

  useEffect(() => {
    if (!open || !offer) return;
    trackImpression(offer);
  }, [open, offer, trackImpression]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    seenRef.current = readSeen();

    let cancelled = false;
    const timer = window.setTimeout(() => {
      storefrontApi
        .getPublicOffers()
        .catch(() => null)
        .then((bundleRes) => {
          if (cancelled) return;
          const coupons = Array.isArray(bundleRes?.data?.coupons)
            ? (bundleRes!.data.coupons as PublicCoupon[])
            : [];
          const sales = Array.isArray(bundleRes?.data?.campaigns)
            ? (bundleRes!.data.campaigns as PublicSale[])
            : [];
          const promotions = Array.isArray(bundleRes?.data?.promotions)
            ? (bundleRes!.data.promotions as PublicPromotion[])
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

  const markAllSeen = useCallback(() => {
    for (const item of queue) {
      seenRef.current.add(item.key);
    }
    writeSeen(seenRef.current);
  }, [queue]);

  const closeModal = useCallback(() => {
    const current = queue[index];
    if (current) {
      trackOfferEvent(current, 'popup_dismiss');
    }
    markAllSeen();
    setVisible(false);
    window.setTimeout(() => setOpen(false), 260);
  }, [queue, index, markAllSeen]);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= queue.length) return;
      setCopied(false);
      setIndex(nextIndex);
      trackImpression(queue[nextIndex]!);
    },
    [queue, trackImpression],
  );

  const goRelative = useCallback(
    (delta: -1 | 1) => {
      if (total <= 1) return;
      const next = (index + delta + queue.length) % queue.length;
      goToSlide(next);
    },
    [index, queue.length, total, goToSlide],
  );

  const onSwipeStart = useCallback((clientX: number, clientY: number) => {
    swipeStartRef.current = { x: clientX, y: clientY };
  }, []);

  const onSwipeEnd = useCallback(
    (clientX: number, clientY: number) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start || total <= 1) return;
      const dx = clientX - start.x;
      const dy = clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
      goRelative(dx < 0 ? 1 : -1);
    },
    [goRelative, total],
  );

  useEffect(() => {
    if (!open || total <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % queue.length;
        const item = queue[next];
        if (item) trackImpression(item);
        setCopied(false);
        return next;
      });
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [open, total, queue, trackImpression, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockBodyScroll();
    };
  }, [open, closeModal]);

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

  const copy = getOfferCopy(offer);

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.ariaLabel}
    >
      <button
        type="button"
        aria-label="Close offer"
        className={cn(
          'absolute inset-0 bg-navy-950/55 backdrop-blur-[6px] transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={closeModal}
      />

      <div
        className={cn(
          'relative z-[1] w-full sm:max-w-[min(420px,92vw)] overflow-hidden',
          'rounded-t-2xl sm:rounded-3xl bg-navy-950 shadow-2xl shadow-navy-950/40',
          'transition-all duration-300 ease-out will-change-transform',
          visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-4 opacity-0 scale-[0.96]',
        )}
      >
        <div
          className="relative aspect-[3/4] w-full overflow-hidden touch-pan-y select-none"
          onTouchStart={(e) => {
            if ((e.target as HTMLElement).closest('button, a')) return;
            const t = e.touches[0];
            if (!t) return;
            swipeTrackingRef.current = true;
            onSwipeStart(t.clientX, t.clientY);
          }}
          onTouchEnd={(e) => {
            if (!swipeTrackingRef.current) return;
            swipeTrackingRef.current = false;
            const t = e.changedTouches[0];
            if (t) onSwipeEnd(t.clientX, t.clientY);
          }}
          onTouchCancel={() => {
            swipeTrackingRef.current = false;
            swipeStartRef.current = null;
          }}
        >
          {queue.map((slide, i) => {
            const slideCopy = getOfferCopy(slide);
            const slideHasImage = Boolean(slideCopy.imageUrl);
            const isActive = i === index;

            return (
              <div
                key={slide.key}
                className={cn(
                  'absolute inset-0 transition-opacity duration-500 ease-out',
                  isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none',
                )}
                aria-hidden={!isActive}
              >
                {slideHasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slideCopy.imageUrl}
                    alt=""
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out',
                      isActive && visible ? 'scale-100' : 'scale-105',
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'absolute inset-0',
                      slide.kind === 'promotion'
                        ? 'bg-gradient-to-br from-[#8a6d3b] via-navy-900 to-brand-800'
                        : 'bg-gradient-to-br from-navy-900 via-brand-800 to-navy-800',
                    )}
                  />
                )}

                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/35 to-transparent"
                  aria-hidden
                />

                <div
                  className={cn(
                    'absolute inset-x-0 bottom-0 z-[2] flex flex-col justify-end p-4 text-left sm:p-6',
                    total > 1 ? 'pb-8 sm:pb-9' : 'pb-6 sm:pb-7',
                  )}
                >
                  {!slideHasImage ? (
                    <div className="mb-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {slide.kind === 'sale' ? (
                            <Percent className="h-3 w-3" />
                          ) : slide.kind === 'promotion' ? (
                            <Sparkles className="h-3 w-3" />
                          ) : (
                            <Tag className="h-3 w-3" />
                          )}
                          {slideCopy.badge}
                        </span>
                        <span className="rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-100 backdrop-blur-sm">
                          {slideCopy.label}
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl font-semibold leading-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.55)] sm:text-3xl">
                        {slideCopy.title}
                      </h2>
                    </div>
                  ) : null}

                  {slideCopy.overlayLine ? (
                    <p
                      className={cn('mb-2 leading-snug', slideCopy.typo.overlayClass)}
                      style={visitPopupTextStyle(slideCopy.textStyle, slideCopy.textColor)}
                    >
                      {slideCopy.overlayLine}
                    </p>
                  ) : null}

                  {slideCopy.description ? (
                    <p
                      className={cn('mb-3 max-w-[95%] line-clamp-3', slideCopy.typo.bodyClass)}
                      style={visitPopupTextStyle(slideCopy.textStyle, slideCopy.textColor, 0.92)}
                    >
                      {slideCopy.description}
                    </p>
                  ) : null}

                  {slide.kind === 'coupon' && slide.data.minOrderAmount ? (
                    <p
                      className={cn('mb-2 text-[11px] font-medium', slideCopy.typo.bodyClass)}
                      style={visitPopupTextStyle(slideCopy.textStyle, slideCopy.textColor, 0.8)}
                    >
                      Min. order ₹{slide.data.minOrderAmount}
                    </p>
                  ) : null}

                  {slideCopy.terms && !slideHasImage ? (
                    <p className="mb-3 text-[9px] leading-relaxed text-white/55 line-clamp-2">
                      T&amp;C: {slideCopy.terms}
                    </p>
                  ) : null}

                  {isActive ? (
                    <div>
                      {slide.kind === 'coupon' ? (
                        <button
                          type="button"
                          onClick={copyCode}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 backdrop-blur-md',
                            'transition hover:bg-white/15 active:scale-[0.98]',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
                          )}
                        >
                          <span
                            className={cn('min-w-0 truncate', slideCopy.typo.codeClass)}
                            style={visitPopupTextStyle(slideCopy.textStyle, slideCopy.textColor)}
                          >
                            {slide.data.code}
                          </span>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide',
                              copied ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white',
                            )}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </>
                            )}
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={slide.kind === 'sale' ? SHOP_SALE_HREF : '/shop'}
                          onClick={() => {
                            trackOfferEvent(slide, 'popup_cta_click');
                            markAllSeen();
                            setOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5',
                            'text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition active:scale-[0.98]',
                            'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
                          )}
                        >
                          {slide.kind === 'promotion' ? 'Shop now' : 'Shop the sale'}
                          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                        </Link>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={closeModal}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          {total > 1 ? (
            <div
              className="pointer-events-none absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1"
              role="tablist"
              aria-label="Offer slides"
            >
              {queue.map((slide, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={slide.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Offer ${i + 1} of ${total}`}
                    onClick={() => goToSlide(i)}
                    className={cn(
                      'pointer-events-auto rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                      isActive ? 'h-1.5 w-3 bg-white/95' : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/65',
                    )}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
