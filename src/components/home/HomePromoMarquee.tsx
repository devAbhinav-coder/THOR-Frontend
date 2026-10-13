"use client";

import { useEffect, useMemo, useState } from "react";
import { storefrontApi } from "@/lib/api";
import {
  buildHomePromoMarqueeLines,
  type StorefrontPublicOffersBundle,
} from "@/lib/homePromoMarqueeLines";
import { cn } from "@/lib/utils";

type Props = {
  announcementMessages?: readonly string[];
  initialOffers?: StorefrontPublicOffersBundle | null;
  className?: string;
};

function MarqueeTrack({ lines }: { lines: string[] }) {
  const items = useMemo(() => [...lines, ...lines], [lines]);
  const durationSec = Math.max(28, lines.length * 9);

  return (
    <div
      className='home-promo-marquee-track flex w-max whitespace-nowrap'
      style={{ animationDuration: `${durationSec}s` }}
      aria-hidden
    >
      {items.map((line, i) => (
        <span
          key={`${line}-${i}`}
          className='inline-flex shrink-0 items-center px-6 sm:px-8'
        >
          <span className='text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c5a059] sm:text-[11px] sm:tracking-[0.28em]'>
            {line}
          </span>
          <span
            className='mx-6 text-[8px] text-[#c5a059]/45 sm:mx-8'
            aria-hidden
          >
            ◆
          </span>
        </span>
      ))}
    </div>
  );
}

export default function HomePromoMarquee({
  announcementMessages = [],
  initialOffers = null,
  className,
}: Props) {
  const [offers, setOffers] = useState<StorefrontPublicOffersBundle | null>(
    initialOffers,
  );

  useEffect(() => {
    if (initialOffers !== null && initialOffers !== undefined) return;
    let cancelled = false;
    storefrontApi
      .getPublicOffers()
      .then((res) => {
        if (cancelled || !res?.data) return;
        setOffers({
          coupons: Array.isArray(res.data.coupons) ? res.data.coupons : [],
          campaigns: Array.isArray(res.data.campaigns) ? res.data.campaigns : [],
          promotions:
            Array.isArray(res.data.promotions) ? res.data.promotions : [],
        });
      })
      .catch(() => {
        /* keep SSR bundle */
      });
    return () => {
      cancelled = true;
    };
  }, [initialOffers]);

  const lines = useMemo(
    () => buildHomePromoMarqueeLines(announcementMessages, offers),
    [announcementMessages, offers],
  );

  if (lines.length === 0) return null;

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden border-y border-[#c5a059]/25 bg-[#141414]",
        className,
      )}
      aria-label='Store offers and announcements'
    >
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-[#141414]' />
      <div className='relative flex py-2 sm:py-2.5'>
        <MarqueeTrack lines={lines} />
      </div>
      <p className='sr-only'>{lines.join(". ")}</p>
    </section>
  );
}
