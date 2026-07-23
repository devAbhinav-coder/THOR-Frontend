'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { PublicCoupon } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Props = {
  coupon: PublicCoupon;
  className?: string;
};

function discountLabel(coupon: PublicCoupon) {
  if (coupon.discountType === 'percentage') return `${coupon.discountValue}% OFF`;
  if (coupon.discountType === 'fixed') return `At ₹${coupon.discountValue}`;
  return `₹${coupon.discountValue} OFF`;
}

function CopyChip({
  code,
  copied,
  onCopy,
  dark = false,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCopy();
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-sm font-bold tracking-wide transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        dark
          ? 'bg-white text-navy-900 shadow-sm hover:bg-gray-50'
          : 'bg-white text-navy-900 border border-gray-200 shadow-sm hover:bg-gray-50',
      )}
      aria-label={`Copy code ${code}`}
    >
      <span>{code}</span>
      {copied ?
        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      : <Copy className="h-3.5 w-3.5 text-navy-900/60 shrink-0" />}
    </button>
  );
}

export function CouponDisplayCard({ coupon, className }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('Code copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy');
    }
  };

  const title = coupon.displayTitle || coupon.description || discountLabel(coupon);

  if (coupon.imageUrl) {
    return (
      <div
        className={cn(
          'group relative w-[200px] sm:w-[220px] shrink-0 overflow-hidden rounded-2xl',
          'ring-1 ring-navy-900/8 shadow-sm bg-white',
          className,
        )}
      >
        <button
          type="button"
          onClick={copyCode}
          className="relative block w-full aspect-[3/4] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coupon.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/80 font-semibold">
              {discountLabel(coupon)}
            </p>
            <p className="mt-0.5 font-serif text-base font-semibold leading-snug text-white line-clamp-2">
              {title}
            </p>
          </div>
        </button>
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100 bg-white">
          <span className="text-[11px] text-gray-500">Tap to copy</span>
          <CopyChip code={coupon.code} copied={copied} onCopy={copyCode} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-[240px] sm:w-[280px] shrink-0 overflow-hidden rounded-2xl bg-white',
        'ring-1 ring-navy-900/8 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        onClick={copyCode}
        className="w-full text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-brand-700 font-semibold">
          {discountLabel(coupon)}
        </p>
        <p className="mt-1 font-serif text-base font-semibold leading-snug text-navy-900 line-clamp-2">
          {title}
        </p>
        {coupon.minOrderAmount ?
          <p className="mt-1 text-[11px] text-gray-500">Min order ₹{coupon.minOrderAmount}</p>
        : null}
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100">
        <span className="text-[11px] text-gray-500">Tap to copy</span>
        <CopyChip code={coupon.code} copied={copied} onCopy={copyCode} />
      </div>
    </div>
  );
}
