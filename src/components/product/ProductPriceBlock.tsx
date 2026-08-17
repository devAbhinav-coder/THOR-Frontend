'use client';

import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { getStorefrontPriceDisplay } from '@/lib/productPricing';

type ProductPriceBlockProps = {
  product: Product;
  /** When shop expands one card per shade, price follows that color's SKUs. */
  displayColor?: string | null;
  size?: 'sm' | 'md' | 'lg';
  sellClassName?: string;
  mrpClassName?: string;
  className?: string;
  showBadge?: boolean;
};

export default function ProductPriceBlock({
  product,
  displayColor = null,
  size = 'sm',
  sellClassName,
  mrpClassName,
  className,
  showBadge = true,
}: ProductPriceBlockProps) {
  const d = getStorefrontPriceDisplay(product, displayColor);

  const sellSize =
    size === 'lg' ? 'text-3xl sm:text-4xl font-serif font-medium'
    : size === 'md' ? 'text-sm font-semibold sm:text-[15px]'
    : 'text-base font-bold';

  const mrpSize =
    size === 'lg' ? 'text-base'
    : size === 'md' ? 'text-xs'
    : 'text-sm';

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span
        className={cn(
          sellSize,
          size === 'lg' ? 'text-navy-900' : 'text-gray-900',
          sellClassName,
        )}
        aria-label={`Price: ${d.sellLabel}`}
      >
        {d.sellLabel}
      </span>
      {d.mrpLabel && (
        <span
          className={cn(mrpSize, 'text-gray-400 line-through', mrpClassName)}
          aria-label={`Original price: ${d.mrpLabel}`}
        >
          {d.mrpLabel}
        </span>
      )}
      {showBadge && d.showDiscount && (
        <span
          className={cn(
            'inline-flex items-center font-semibold uppercase tracking-wide text-[#8a6d3b]',
            size === 'lg' ?
              'bg-[#c5a059]/15 px-3 py-1 text-[10px] tracking-[0.16em]'
            : 'text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded',
          )}
        >
          {d.saleBadge ?
            `${d.saleBadge} · ${d.discountPercent}% off`
          : `${d.discountPercent}% OFF`}
        </span>
      )}
    </div>
  );
}
