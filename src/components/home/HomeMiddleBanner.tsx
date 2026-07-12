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
    <section className="w-full bg-[#f9f9f9] py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="group relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[2.5/1] border border-[#c5a059]/40 shadow-sm">
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
            "absolute inset-0 flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-32",
            currentAlignClass
          )}>
            <div className={cn(
              "flex flex-col max-w-2xl transform transition-all duration-700",
              currentAlignClass
            )}>
              {/* Optional Eyebrow effect if we treat first word of subtitle differently or just keep subtitle */}
              {banner.title && (
                <h2 className="mb-6 font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-wide drop-shadow-md text-[#c5a059]">
                  {banner.title}
                </h2>
              )}
              
              {banner.subtitle && (
                <p className={cn(
                  "mb-10 text-base sm:text-lg lg:text-xl font-light tracking-wide leading-relaxed drop-shadow-sm",
                  isDarkText ? "text-gray-800" : "text-white/90"
                )}>
                  {banner.subtitle}
                </p>
              )}
              
              {banner.linkText && banner.linkUrl && (
                <Link
                  href={banner.linkUrl}
                  className="relative overflow-hidden border border-[#c5a059] px-10 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] transition-all duration-500 text-[#c5a059] shadow-sm hover:bg-[#c5a059] hover:text-white"
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
