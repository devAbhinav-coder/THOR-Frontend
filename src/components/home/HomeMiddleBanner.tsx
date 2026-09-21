"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeMiddleBannerProps {
  banner: {
    image?: string;
    title?: string;
    subtitle?: string;
    linkText?: string;
    linkUrl?: string;
    textAlignment?: "left" | "center" | "right";
    textColor?: "light" | "dark";
    isActive?: boolean;
  };
}

export default function HomeMiddleBanner({ banner }: HomeMiddleBannerProps) {
  if (!banner?.isActive || !banner?.image) return null;

  const isDarkText = banner.textColor === "dark";

  const alignClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  const currentAlignClass = alignClasses[banner.textAlignment || "center"];

  return (
    <section className='w-full bg-[#f9f9f9] pt-2 sm:pt-4 lg:pt-6 pb-8 sm:pb-10 '>
      <div className='mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8'>
        <div className='group relative aspect-[2.2/1] w-full overflow-hidden border border-[#c5a059]/40 shadow-sm'>
          {/* Full Width Background Image */}
          <Image
            src={banner.image}
            alt={banner.title || "Promotional Banner"}
            fill
            className='object-cover transition-transform duration-[10000ms] ease-linear group-hover:scale-105'
            sizes='(max-width: 1536px) 100vw, 1536px'
            priority
          />

          {/* Subtle Gradient Overlay */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              isDarkText ?
                "bg-gradient-to-r from-white/75 via-white/35 to-transparent sm:bg-gradient-to-t sm:from-white/45 sm:to-transparent"
              : "bg-gradient-to-r from-black/75 via-black/35 to-transparent sm:bg-gradient-to-t sm:from-black/55 sm:to-black/10",
              banner.textAlignment === "center" &&
                (isDarkText ? "bg-white/20" : "bg-black/30"),
            )}
          />

          {/* Content Container */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-center px-3 py-3 sm:px-12 sm:py-8 lg:px-24 lg:py-10",
              currentAlignClass,
            )}
          >
            <div
              className={cn(
                "flex flex-col max-w-2xl transform transition-all duration-700",
                currentAlignClass,
              )}
            >
              {/* Title */}
              {banner.title && (
                <h2 className='mb-1 sm:mb-3 lg:mb-4 font-serif text-sm sm:text-3xl lg:text-5xl xl:text-6xl leading-tight tracking-wide drop-shadow-md text-[#c5a059]'>
                  {banner.title}
                </h2>
              )}

              {/* Subtitle */}
              {banner.subtitle && (
                <p
                  className={cn(
                    "mb-2 sm:mb-6 lg:mb-7 text-[10px] sm:text-base lg:text-lg font-light tracking-wide leading-tight sm:leading-relaxed drop-shadow-sm",
                    isDarkText ? "text-gray-800" : "text-white/90",
                  )}
                >
                  {banner.subtitle}
                </p>
              )}

              {/* CTA Button */}
              {banner.linkText && banner.linkUrl && (
                <Link
                  href={banner.linkUrl}
                  className='relative overflow-hidden border border-[#c5a059] px-3 py-1.5 sm:px-8 sm:py-3 lg:px-10 lg:py-3.5 text-[9px] sm:text-xs lg:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.25em] transition-all duration-500 text-[#c5a059] shadow-sm hover:bg-[#c5a059] hover:text-white'
                >
                  <span className='relative z-10'>{banner.linkText}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
