"use client";

import { Sparkles, Truck, RotateCcw, MapPin } from "lucide-react";
import type { ShopHeroContent } from "@/lib/shopHeroCopy";
import { cn } from "@/lib/utils";

const perkIcons = [Truck, RotateCcw, MapPin] as const;

type Props = {
  content: ShopHeroContent;
  /** Photo banner behind text */
  variant?: "light" | "image";
  /** Shorter padding for shop hero strip */
  compact?: boolean;
  className?: string;
};

export default function ShopHeroBanner({
  content,
  variant = "light",
  compact = false,
  className,
}: Props) {
  const isImage = variant === "image";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isImage ? "text-white" : "text-navy-900",
        className,
      )}
    >
      {!isImage && (
        <>
          <div
            className='pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gold-200/25 blur-3xl'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute inset-0 opacity-[0.35]'
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgb(180 140 130 / 0.15) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />
        </>
      )}

      <div
        className={cn(
          "relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center",
          compact ?
            "py-5 sm:py-6 lg:py-7"
          : "py-10 sm:py-14 lg:py-16",
        )}
      >
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]",
            compact ? "mb-2.5 sm:mb-3" : "mb-5 sm:mb-6",
            isImage ?
              "border-white/25 bg-white/10 text-white/90 backdrop-blur-sm"
            : "border-brand-200/80 bg-white/70 text-brand-800 shadow-sm backdrop-blur-sm",
          )}
        >
          <Sparkles
            className={cn("h-3.5 w-3.5", isImage ? "text-gold-300" : "text-brand-600")}
            aria-hidden
          />
          {content.eyebrow}
        </p>

        <h1 className='font-serif font-bold leading-[1.05] tracking-tight'>
          <span className='sr-only'>{content.h1Accessible}</span>
          <span
            className={cn(
              "block",
              compact ?
                "text-xl sm:text-3xl lg:text-4xl"
              : "text-3xl sm:text-5xl lg:text-[3.25rem]",
              isImage ? "text-white drop-shadow-lg" : "text-navy-900",
            )}
            aria-hidden
          >
            {content.titleLine1}
          </span>
          <span
            className={cn(
              "block mt-0.5 bg-clip-text text-transparent",
              compact ?
                "text-xl sm:text-3xl lg:text-4xl"
              : "mt-1 text-3xl sm:text-5xl lg:text-[3.35rem]",
              isImage ?
                "bg-gradient-to-r from-gold-200 via-white to-brand-200 drop-shadow-md"
              : "bg-gradient-to-r from-brand-700 via-brand-600 to-gold-600",
            )}
            aria-hidden
          >
            {content.titleLine2}
          </span>
        </h1>

        <p
          className={cn(
            "leading-relaxed max-w-2xl mx-auto font-light",
            compact ?
              "mt-2 text-xs sm:text-sm line-clamp-2"
            : "mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg",
            isImage ? "text-white/90 drop-shadow" : "text-gray-600",
          )}
        >
          {content.subtitle}
        </p>

        {!(compact && isImage) && (
        <ul
          className={cn(
            "flex flex-wrap items-center justify-center gap-2",
            compact ? "mt-3 sm:gap-2" : "mt-6 sm:mt-8 sm:gap-3",
          )}
          aria-label='Shopping benefits'
        >
          {content.perks.map((perk, i) => {
            const Icon = perkIcons[i % perkIcons.length];
            return (
              <li
                key={perk}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold",
                  isImage ?
                    "bg-white/12 border border-white/20 text-white backdrop-blur-sm"
                  : "bg-white/80 border border-[#ead9d4] text-navy-800 shadow-sm",
                )}
              >
                <Icon
                  className={cn("h-3.5 w-3.5 shrink-0", isImage ? "text-gold-300" : "text-brand-600")}
                  aria-hidden
                />
                {perk}
              </li>
            );
          })}
        </ul>
        )}
      </div>
    </div>
  );
}
