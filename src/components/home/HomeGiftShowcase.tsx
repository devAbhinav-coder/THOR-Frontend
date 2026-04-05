"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { storefrontApi } from "@/lib/api";
import type { HomeGiftShowcaseCard, StorefrontSettings } from "@/types";
import { cn } from "@/lib/utils";
import { resolveHomeGiftShopButton } from "@/lib/homeGiftShopLink";

const ACCENT_BG: Record<string, string> = {
  rose: "bg-gradient-to-b from-rose-200 via-rose-100 to-rose-300",
  amber: "bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200",
  sage: "bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200",
};

function XSocialIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={className}
      fill='currentColor'
      aria-hidden
    >
      <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
    </svg>
  );
}

function isRealSocialUrl(url?: string) {
  if (!url || !url.trim()) return false;
  return !/^#+$/.test(url.trim()) && url.trim() !== "#";
}

export default function HomeGiftShowcase() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const section = settings?.homeGiftShowcase;
  const footer = settings?.footer;
  const rawCards = section?.cards || [];
  const cards = rawCards.filter(
    (c: HomeGiftShowcaseCard) =>
      (c?.title && c.title.trim()) ||
      (c?.description && c.description.trim()) ||
      (c?.image && c.image.trim()),
  );

  if (!section?.isActive || cards.length === 0) return null;

  return (
    <section className='relative overflow-hidden bg-white py-10 sm:py-14 lg:py-16'>
      <div className='pointer-events-none absolute inset-0 opacity-[0.12]'>
        <div className='absolute left-[8%] top-16 h-3 w-3 rotate-45 bg-brand-500' />
        <div className='absolute left-[12%] top-32 h-2 w-2 bg-brand-400' />
        <div className='absolute right-[15%] top-24 h-4 w-4 rotate-45 border-2 border-brand-400' />
        <div className='absolute right-[22%] top-40 h-1.5 w-12 rounded-full bg-brand-200' />
      </div>

      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16'>
          <div className='max-w-xl'>
            {section.headlineLine1 && (
              <p className='text-2xl font-bold tracking-tight text-brand-600 sm:text-3xl'>
                {section.headlineLine1}
              </p>
            )}
            {section.headlineLine2 && (
              <h2
                className='mt-1 font-sans text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl'
                style={{
                  WebkitTextStroke: "2px rgb(192 57 97)",
                  paintOrder: "stroke fill",
                }}
              >
                {section.headlineLine2}
              </h2>
            )}
            {section.description && (
              <p className='mt-4 text-sm leading-relaxed text-gray-600 sm:text-base'>
                {section.description}
              </p>
            )}

            <div className='mt-8 flex flex-wrap items-center gap-4'>
              <div className='flex items-center gap-2'>
                {/* {isRealSocialUrl(footer?.facebookUrl) && (
                  <a
                    href={footer!.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {isRealSocialUrl(footer?.instagramUrl) && (
                  <a
                    href={footer!.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {isRealSocialUrl(footer?.twitterUrl) && (
                  <a
                    href={footer!.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600"
                    aria-label="X"
                  >
                    <XSocialIcon className="h-4 w-4" />
                  </a>
                )}
                {isRealSocialUrl(footer?.youtubeUrl) && (
                  <a
                    href={footer!.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                )} */}
              </div>
              {section.socialHandle?.trim() && (
                <span className='text-sm font-bold text-gray-800'>
                  {section.socialHandle.trim()}
                </span>
              )}
            </div>
          </div>

          <div className='grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5'>
            {cards.map((card, index) => {
              const accent =
                card.accent && ACCENT_BG[card.accent] ? card.accent : "rose";
              return (
                <div
                  key={`${card.title}-${index}`}
                  className={cn(
                    "flex h-full flex-col rounded-2xl p-4 text-center shadow-sm ring-1 ring-black/5 sm:rounded-3xl sm:p-5",
                    ACCENT_BG[accent],
                  )}
                >
                  <div className='relative mx-auto mb-3 h-[7.25rem] w-[7.25rem] shrink-0 overflow-hidden rounded-full ring-[3px] ring-white/95 shadow-md sm:mb-3.5 sm:h-[8.5rem] sm:w-[8.5rem] lg:h-36 lg:w-36'>
                    {card.image ?
                      <Image
                        src={card.image}
                        alt={card.title || "Gift category"}
                        fill
                        className='object-cover'
                        sizes='(max-width: 640px) 116px, 144px'
                      />
                    : <div className='flex h-full w-full items-center justify-center bg-white/50 text-[10px] text-gray-500'>
                        Add image
                      </div>
                    }
                  </div>
                  {card.title && (
                    <h3 className='font-serif text-base font-bold leading-snug text-gray-800 drop-shadow-sm sm:text-lg'>
                      {card.title}
                    </h3>
                  )}
                  <div className='my-1.5 flex justify-center gap-1 sm:my-2'>
                    <span className='h-1 w-1 rounded-full bg-white/90' />
                    <span className='h-1 w-1 rounded-full bg-white/90' />
                    <span className='h-1 w-1 rounded-full bg-white/90' />
                  </div>
                  {card.description && (
                    <p className='line-clamp-3 flex-1 text-[11px] leading-relaxed text-gray-600 sm:text-xs'>
                      <span className='text-gray-800'>{card.description}</span>
                    </p>
                  )}
                  <div className='mt-3 flex flex-col gap-1.5 sm:mt-4 sm:gap-2'>
                    {(() => {
                      const shop = resolveHomeGiftShopButton(card);
                      if (!shop) return null;
                      if (shop.kind === "coming_soon") {
                        return (
                          <span className='rounded-xl border-2 border-white/70 bg-white/20 px-2.5 py-2 text-center text-[11px] font-bold text-gray-800 sm:px-3 sm:text-xs'>
                            {shop.label}
                          </span>
                        );
                      }
                      const external = /^https?:\/\//i.test(shop.href);
                      return external ?
                          <a
                            href={shop.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='rounded-xl border-2 border-white bg-white/95 px-2.5 py-2 text-center text-[11px] font-bold text-navy-900 shadow-sm transition hover:bg-white sm:px-3 sm:text-xs'
                          >
                            {shop.label}
                          </a>
                        : <Link
                            href={shop.href}
                            className='rounded-xl border-2 border-white bg-white/95 px-2.5 py-2 text-center text-[11px] font-bold text-navy-900 shadow-sm transition hover:bg-white sm:px-3 sm:text-xs'
                          >
                            {shop.label}
                          </Link>;
                    })()}
                    {card.giftButtonLink && (
                      <Link
                        href={card.giftButtonLink}
                        className='rounded-xl border-2 border-white/80 bg-transparent px-2.5 py-2 text-center text-[11px] font-bold text-white transition hover:bg-white/15 sm:px-3 sm:text-xs'
                      >
                        {card.giftButtonText || "Gifting"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
