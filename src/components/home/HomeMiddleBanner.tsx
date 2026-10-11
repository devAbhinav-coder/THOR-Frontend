"use client";

import Image from "next/image";
import Link from "next/link";
import {
  HOME_MIDDLE_BANNER_DESKTOP_ASPECT,
  HOME_MIDDLE_BANNER_MOBILE_ASPECT,
} from "@/lib/homeMiddleBannerLayout";
import { cn } from "@/lib/utils";

interface HomeMiddleBannerProps {
  banner: {
    image?: string;
    imageDesktop?: string;
    title?: string;
    subtitle?: string;
    linkText?: string;
    linkUrl?: string;
    textAlignment?: "left" | "center" | "right";
    textColor?: "light" | "dark";
    isActive?: boolean;
  };
}

function BannerOverlay({
  isDarkText,
  textAlignment,
  variant,
}: {
  isDarkText: boolean;
  textAlignment?: "left" | "center" | "right";
  variant: "mobile" | "desktop";
}) {
  const isDesktop = variant === "desktop";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-500",
        isDarkText ?
          isDesktop ?
            "bg-gradient-to-r from-white/55 via-white/20 to-transparent"
          : "bg-gradient-to-r from-white/75 via-white/35 to-transparent sm:bg-gradient-to-t sm:from-white/45 sm:to-transparent"
        : isDesktop ?
          "bg-gradient-to-r from-black/55 via-black/25 to-transparent"
        : "bg-gradient-to-r from-black/75 via-black/35 to-transparent sm:bg-gradient-to-t sm:from-black/55 sm:to-black/10",
        textAlignment === "center" &&
          (isDarkText ?
            isDesktop ? "bg-white/15"
            : "bg-white/20"
          : isDesktop ? "bg-black/25"
          : "bg-black/30"),
      )}
    />
  );
}

function BannerCopy({
  banner,
  currentAlignClass,
  variant,
}: {
  banner: HomeMiddleBannerProps["banner"];
  currentAlignClass: string;
  variant: "mobile" | "desktop";
}) {
  const isDesktop = variant === "desktop";

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col justify-center",
        isDesktop ? "px-12 py-2 xl:px-20" : "px-3 py-2 sm:px-12 ",
        currentAlignClass,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex max-w-2xl flex-col",
          currentAlignClass,
        )}
      >
        {banner.title && (
          <h2
            className={cn(
              "font-serif leading-tight tracking-wide drop-shadow-md text-[#c5a059]",
              isDesktop ?
                "mb-1.5 text-2xl xl:text-3xl"
              : "mb-1 text-sm sm:mb-3 sm:text-3xl",
            )}
          >
            {banner.title}
          </h2>
        )}

        {banner.linkText && banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            className={cn(
              "relative inline-flex w-fit items-center justify-center overflow-hidden border border-[#c5a059] font-semibold uppercase transition-all duration-500 text-[#c5a059] shadow-sm hover:bg-[#c5a059] hover:text-white",
              isDesktop ?
                "px-5 py-1.5 text-[10px] tracking-[0.18em] xl:px-7 xl:py-2 xl:text-[11px]"
              : "mt-1 max-w-[10.5rem] px-2.5 py-1 text-[8px] tracking-[0.12em] sm:mt-0 sm:max-w-none sm:px-8 sm:py-3 sm:text-xs sm:tracking-[0.25em]",
            )}
          >
            <span className='relative z-10'>{banner.linkText}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function HomeMiddleBanner({ banner }: HomeMiddleBannerProps) {
  const mobileImage = banner?.image?.trim() || "";
  const desktopImage = banner?.imageDesktop?.trim() || "";
  const mobileSrc = mobileImage || desktopImage;
  const desktopSrc = desktopImage || mobileImage;

  if (!banner?.isActive || !mobileSrc) return null;

  const isDarkText = banner.textColor === "dark";
  const alignClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };
  const currentAlignClass = alignClasses[banner.textAlignment || "center"];
  const alt = banner.title || "Promotional Banner";
  const frameClass =
    "group relative w-full overflow-hidden border border-[#c5a059]/40 shadow-sm";

  return (
    <section className='w-full bg-[#f9f9f9] py-2'>
      <div className='mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8'>
        {/* Mobile only — tall panoramic (2.2:1). Use mobile upload. */}
        <div
          className={cn(frameClass, "lg:hidden")}
          style={{ aspectRatio: `${HOME_MIDDLE_BANNER_MOBILE_ASPECT} / 1` }}
        >
          <Image
            src={mobileSrc}
            alt={alt}
            fill
            className='object-cover object-center transition-transform duration-[10000ms] ease-linear group-hover:scale-[1.02]'
            sizes='100vw'
            priority
          />
          <BannerOverlay
            isDarkText={isDarkText}
            textAlignment={banner.textAlignment}
            variant='mobile'
          />
          <BannerCopy
            banner={banner}
            currentAlignClass={currentAlignClass}
            variant='mobile'
          />
        </div>

        {/* Laptop+ only — low strip (4.4:1 = half mobile height). Use desktop upload at same ratio. */}
        <div
          className={cn(frameClass, "hidden lg:block")}
          style={{ aspectRatio: `${HOME_MIDDLE_BANNER_DESKTOP_ASPECT} / 1` }}
        >
          <Image
            src={desktopSrc}
            alt={alt}
            fill
            className='object-cover object-center transition-transform duration-[10000ms] ease-linear group-hover:scale-[1.02]'
            sizes='(min-width: 1024px) min(100vw, 1536px)'
            priority
          />
          <BannerOverlay
            isDarkText={isDarkText}
            textAlignment={banner.textAlignment}
            variant='desktop'
          />
          <BannerCopy
            banner={banner}
            currentAlignClass={currentAlignClass}
            variant='desktop'
          />
        </div>
      </div>
    </section>
  );
}
