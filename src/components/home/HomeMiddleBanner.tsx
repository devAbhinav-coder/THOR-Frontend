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
    <section className="w-full bg-[#f9f9f9] pt-2 sm:pt-4 lg:pt-6 pb-8 sm:pb-12 lg:pb-16">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="group relative w-full h-[220px] sm:h-[320px] lg:h-[380px] xl:h-[420px] max-h-[420px] overflow-hidden rounded-md border border-[#c5a059]/40 shadow-sm bg-black/90">
          {/* Ambient blurred backdrop so wide screens fill softly with the image's colors */}
          <Image
            src={banner.image}
            alt=""
            fill
            className="object-cover blur-2xl scale-125 opacity-50 brightness-75 transition-transform duration-[10000ms] ease-linear group-hover:scale-135 pointer-events-none"
            aria-hidden="true"
          />

          {/* Main 16:9 foreground image (object-contain ensures 100% full view with ZERO cropping) */}
          <Image
            src={banner.image}
            alt={banner.title || "Promotional Banner"}
            fill
            className="object-contain transition-transform duration-[10000ms] ease-linear group-hover:scale-[1.03]"
            sizes="(max-width: 1536px) 100vw, 1536px"
            priority
          />

          {/* Vignette & Gradient Overlay for premium look */}
          <div 
            className={cn(
              "absolute inset-0 transition-opacity duration-500 pointer-events-none",
              isDarkText 
                ? "bg-gradient-to-r from-white/80 via-white/40 to-white/10 sm:bg-gradient-to-t sm:from-white/50 sm:to-transparent" 
                : "bg-gradient-to-r from-black/80 via-black/40 to-black/10 sm:bg-gradient-to-t sm:from-black/60 sm:to-black/10",
              banner.textAlignment === "center" && (isDarkText ? "bg-white/30" : "bg-black/35")
            )} 
          />
          
          {/* Content Container */}
          <div className={cn(
            "absolute inset-0 flex flex-col justify-center px-4 py-4 sm:px-12 sm:py-8 lg:px-24 lg:py-10",
            currentAlignClass
          )}>
            <div className={cn(
              "flex flex-col max-w-2xl transform transition-all duration-700",
              currentAlignClass
            )}>
              {/* Title */}
              {banner.title && (
                <h2 className="mb-2 sm:mb-3 lg:mb-4 font-serif text-xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight tracking-wide drop-shadow-md text-[#c5a059]">
                  {banner.title}
                </h2>
              )}
              
              {/* Subtitle */}
              {banner.subtitle && (
                <p className={cn(
                  "mb-3 sm:mb-5 lg:mb-6 text-xs sm:text-base lg:text-lg font-light tracking-wide leading-relaxed drop-shadow-sm",
                  isDarkText ? "text-gray-800" : "text-white/90"
                )}>
                  {banner.subtitle}
                </p>
              )}
              
              {/* CTA Button */}
              {banner.linkText && banner.linkUrl && (
                <Link
                  href={banner.linkUrl}
                  className="relative overflow-hidden border border-[#c5a059] px-4 py-2 sm:px-7 sm:py-2.5 lg:px-9 lg:py-3 text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-all duration-500 text-[#c5a059] shadow-sm hover:bg-[#c5a059] hover:text-white"
                >
                  <span className="relative z-10">{banner.linkText}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
