'use client';

import { useEffect, useState } from 'react';
import { couponApi } from '@/lib/api';
import type { PublicCoupon } from '@/types';
import { CouponDisplayCard } from '@/components/coupons/CouponDisplayCard';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  title?: string;
  subtitle?: string;
};

export default function CouponStrip({
  className,
  title = 'Available offers',
  subtitle = 'Tap Copy to save a code',
}: Props) {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    couponApi
      .getPublic()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.coupons;
        setCoupons(Array.isArray(list) ? (list as PublicCoupon[]) : []);
      })
      .catch(() => {
        if (!cancelled) setCoupons([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || coupons.length === 0) return null;

  return (
    <section className={cn('w-full', className)} aria-label="Coupon offers">
      <div className="mb-3 sm:mb-4">
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-navy-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {coupons.map((coupon) => (
          <div key={coupon.code} className="snap-start">
            <CouponDisplayCard coupon={coupon} />
          </div>
        ))}
      </div>
    </section>
  );
}
