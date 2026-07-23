'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Copy, Check, Tag, Percent } from 'lucide-react';
import { couponApi, saleCampaignApi } from '@/lib/api';
import type { PublicCoupon, PublicSale } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/** Session: which offer keys already dismissed this tab */
const SEEN_KEY = 'hor_offer_popup_seen_v3';

type OfferKind = 'coupon' | 'sale';

type ActiveOffer =
  | { kind: 'coupon'; key: string; data: PublicCoupon }
  | { kind: 'sale'; key: string; data: PublicSale };

function discountLabel(
  type: 'percentage' | 'flat' | 'fixed',
  value: number,
) {
  if (type === 'percentage') return `${value}% OFF`;
  if (type === 'fixed') return `At ₹${value}`;
  return `₹${value} OFF`;
}

function offerKey(kind: OfferKind, id: string) {
  return `${kind}:${id}`;
}

/** Build queue: sales first (with image first), then coupons (with image first). All public/active storefront items. */
function buildOfferQueue(coupons: PublicCoupon[], sales: PublicSale[]): ActiveOffer[] {
  const saleOffers: ActiveOffer[] = sales.map((data, i) => ({
    kind: 'sale' as const,
    key: offerKey('sale', data._id || `${data.name}|${data.startDate}|${i}`),
    data,
  }));
  const couponOffers: ActiveOffer[] = coupons.map((data) => ({
    kind: 'coupon' as const,
    key: offerKey('coupon', data.code),
    data,
  }));

  const withImageFirst = <T extends ActiveOffer>(list: T[]) =>
    [...list].sort((a, b) => Number(Boolean(b.data.imageUrl)) - Number(Boolean(a.data.imageUrl)));

  return [...withImageFirst(saleOffers), ...withImageFirst(couponOffers)];
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    seenRef.current = readSeen();

    let cancelled = false;
    const timer = window.setTimeout(() => {
      Promise.all([
        couponApi.getPublic().catch(() => null),
        saleCampaignApi.getPublic().catch(() => null),
      ]).then(([couponRes, saleRes]) => {
        if (cancelled) return;
        const coupons = Array.isArray(couponRes?.data?.coupons)
          ? (couponRes!.data.coupons as PublicCoupon[])
          : [];
        const sales = Array.isArray(saleRes?.data?.campaigns)
          ? (saleRes!.data.campaigns as PublicSale[])
          : [];

        // Public APIs already return only active + showOnStorefront
        const all = buildOfferQueue(coupons, sales);
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

  /** Close current → immediately open next remaining offer in the stack */
  const dismiss = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const current = queue[index];
    if (current) markSeen(current.key);

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismiss]);

  const copyCode = async () => {
    if (!offer || offer.kind !== 'coupon') return;
    try {
      await navigator.clipboard.writeText(offer.data.code);
      setCopied(true);
      toast.success('Code copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  if (!mounted || !open || !offer) return null;

  const imageUrl = offer.data.imageUrl;
  const label = discountLabel(offer.data.discountType, offer.data.discountValue);

  const title =
    offer.kind === 'coupon'
      ? (offer.data.displayTitle || offer.data.code || label).trim()
      : (offer.data.name || label).trim();

  const rawDescription = (offer.data.description || '').trim();
  const description =
    rawDescription && rawDescription.toLowerCase() !== title.toLowerCase()
      ? rawDescription
      : '';

  const badge =
    offer.kind === 'sale' ? offer.data.badgeText || 'Sale' : 'Limited offer';

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={offer.kind === 'sale' ? 'Sale offer' : 'Special offer'}
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
          'relative z-[1] w-full sm:max-w-[400px] overflow-hidden',
          'rounded-t-[1.75rem] sm:rounded-[1.75rem] bg-white shadow-2xl shadow-navy-950/30',
          'transition-all duration-300 ease-out will-change-transform',
          visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 sm:translate-y-4 opacity-0 scale-[0.96]',
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow-md ring-1 ring-black/5 transition hover:bg-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        {total > 1 ? (
          <p className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-navy-800 shadow-md ring-1 ring-black/5">
            {position} / {total}
          </p>
        ) : null}

        <div className="relative aspect-[3/4] max-h-[52vh] sm:max-h-[420px] w-full overflow-hidden bg-navy-900">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out',
                visible ? 'scale-100' : 'scale-110',
              )}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-brand-800 to-navy-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-navy-950/15" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
              {offer.kind === 'sale' ? (
                <Percent className="h-3 w-3" />
              ) : (
                <Tag className="h-3 w-3" />
              )}
              {badge}
            </p>
            <p className="mt-3 text-sm font-semibold tracking-wide text-[#e8d5a3]">{label}</p>
            <h2 className="mt-1 font-serif text-2xl sm:text-[1.75rem] font-medium leading-snug">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-white/80 line-clamp-3">
                {description}
              </p>
            ) : null}
            {offer.kind === 'coupon' && offer.data.minOrderAmount ? (
              <p className="mt-2 text-xs text-white/65">
                Min order ₹{offer.data.minOrderAmount}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 bg-white p-4 sm:p-5">
          {offer.kind === 'coupon' ? (
            <>
              <p className="text-center text-xs text-gray-500">Copy code &amp; use at checkout</p>
              <button
                type="button"
                onClick={copyCode}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5',
                  'shadow-sm transition hover:border-navy-900/20 hover:shadow-md active:scale-[0.99]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                )}
              >
                <span className="font-mono text-lg font-bold tracking-[0.14em] text-navy-900">
                  {offer.data.code}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
                    copied ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-900 text-white',
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
            </>
          ) : (
            <Link
              href="/shop"
              onClick={dismiss}
              className={cn(
                'flex w-full items-center justify-center rounded-xl bg-navy-900 px-4 py-3.5',
                'text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800 active:scale-[0.99]',
              )}
            >
              Shop the sale
            </Link>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="w-full py-2 text-center text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            {index + 1 < total ? 'Next offer' : 'Continue shopping'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
