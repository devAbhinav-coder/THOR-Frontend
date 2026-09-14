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
        <div className="group relative aspect-[16/9] w-full overflow-hidden border border-[#c5a059]/40 shadow-sm">
          {/* Background Image with slow zoom effect on hover */}
          <Image
            src={banner.image}
            alt={banner.title || "Promotional Banner"}
            fill
            className="object-cover transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
            sizes="(max-width: 1536px) 100vw, 1536px"
            priority
          />

          {/* Vignette & Gradient Overlay for premium look */}
          <div 
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              isDarkText 
                ? "bg-gradient-to-r from-white/80 via-white/40 to-white/10 sm:bg-gradient-to-t sm:from-white/50 sm:to-transparent" 
                : "bg-gradient-to-r from-black/80 via-black/40 to-black/10 sm:bg-gradient-to-t sm:from-black/60 sm:to-black/10",
              banner.textAlignment === "center" && (isDarkText ? "bg-white/30" : "bg-black/40")
            )} 
          />
          
          {/* Content Container */}
          <div className={cn(
            "absolute inset-0 flex flex-col justify-center px-4 py-4 sm:px-12 sm:py-8 lg:px-24 lg:py-12",
            currentAlignClass
          )}>
            <div className={cn(
              "flex flex-col max-w-2xl transform transition-all duration-700",
              currentAlignClass
            )}>
              {/* Optional Eyebrow effect if we treat first word of subtitle differently or just keep subtitle */}
              {banner.title && (
                <h2 className="mb-2 sm:mb-4 lg:mb-6 font-serif text-xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight tracking-wide drop-shadow-md text-[#c5a059]">
                  {banner.title}
                </h2>
              )}
              
              {banner.subtitle && (
                <p className={cn(
                  "mb-3 sm:mb-6 lg:mb-8 text-xs sm:text-base lg:text-xl font-light tracking-wide leading-relaxed drop-shadow-sm",
                  isDarkText ? "text-gray-800" : "text-white/90"
                )}>
                  {banner.subtitle}
                </p>
              )}
              
              {banner.linkText && banner.linkUrl && (
                <Link
                  href={banner.linkUrl}
                  className="relative overflow-hidden border border-[#c5a059] px-4 py-2 sm:px-8 sm:py-3 lg:px-10 lg:py-3.5 text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-all duration-500 text-[#c5a059] shadow-sm hover:bg-[#c5a059] hover:text-white"
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
