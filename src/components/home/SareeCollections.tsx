"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay } from "swiper/modules";
import { Category } from "@/types";
import { cn } from "@/lib/utils";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

import "swiper/css";

interface SareeCollectionsProps {
  subcategories: Category[] | null;
}

export default function SareeCollections({ subcategories }: SareeCollectionsProps) {
  const [swiperReady, setSwiperReady] = useState<SwiperType | null>(null);
  const [isSwiperLocked, setIsSwiperLocked] = useState(false);

  const sortedSubcategories = useMemo(() => {
    if (!subcategories) return [];
    return [...subcategories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [subcategories]);

  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    setSwiperReady(swiper);
    setIsSwiperLocked(swiper.isLocked);
  }, []);

  const handleSwiperLock = useCallback(() => setIsSwiperLocked(true), []);
  const handleSwiperUnlock = useCallback(() => setIsSwiperLocked(false), []);

  const handleSlidePrev = useCallback(() => {
    if (swiperReady && !swiperReady.destroyed && !isSwiperLocked) {
      swiperReady.slidePrev();
    }
  }, [swiperReady, isSwiperLocked]);

  const handleSlideNext = useCallback(() => {
    if (swiperReady && !swiperReady.destroyed && !isSwiperLocked) {
      swiperReady.slideNext();
    }
  }, [swiperReady, isSwiperLocked]);

  const pauseAuto = useCallback(() => {
    if (swiperReady && !swiperReady.destroyed && !isSwiperLocked) {
      swiperReady.autoplay?.stop();
    }
  }, [swiperReady, isSwiperLocked]);

  const resumeAuto = useCallback(() => {
    if (swiperReady && !swiperReady.destroyed && !isSwiperLocked) {
      swiperReady.autoplay?.start();
    }
  }, [swiperReady, isSwiperLocked]);

  if (!sortedSubcategories.length) return null;

  return (
    <section className={cn(homeSectionStyles.pageBg, "py-12 sm:py-14 lg:py-16")}>
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 px-1 sm:mb-10 lg:flex-row lg:items-end lg:justify-between lg:px-0">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs">
              Explore Subcollections
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium italic leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] lg:not-italic">
              Shop Our <span className="lg:italic">Saree Collection</span>
            </h2>
          </div>
          <Link
            href="/shop/collections/sarees"
            className="shrink-0 text-[11px] font-medium uppercase tracking-[0.22em] text-[#c5a059] underline decoration-[#c5a059]/60 underline-offset-[6px] transition-colors hover:text-navy-900 hover:decoration-navy-900 sm:text-xs"
          >
            View All
          </Link>
        </div>

        <div
          data-lenis-prevent-horizontal
          className={cn(
            "relative min-h-[360px] overflow-hidden sm:min-h-[420px] lg:min-h-[480px]",
            isSwiperLocked && "[&_.swiper-wrapper]:justify-center"
          )}
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
          onPointerDown={pauseAuto}
          onPointerUp={resumeAuto}
          onPointerCancel={resumeAuto}
        >
          {!isSwiperLocked && (
            <>
              <button
                type="button"
                onClick={handleSlidePrev}
                className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#c5a059]/35 bg-white/95 text-[#c5a059] shadow-md transition-colors hover:bg-white sm:left-1 sm:h-10 sm:w-10"
                aria-label="Previous subcategories"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={handleSlideNext}
                className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#c5a059]/35 bg-white/95 text-[#c5a059] shadow-md transition-colors hover:bg-white sm:right-1 sm:h-10 sm:w-10"
                aria-label="Next subcategories"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}
          <style jsx global>{`
            .category-collection-swiper .swiper-wrapper {
              transition-timing-function: linear !important;
            }
          `}</style>
          <Swiper
            modules={[Autoplay]}
            onSwiper={handleSwiperInit}
            onLock={handleSwiperLock}
            onUnlock={handleSwiperUnlock}
            slidesPerView="auto"
            spaceBetween={12}
            speed={8000}
            autoplay={
              isSwiperLocked
                ? false
                : {
                    delay: 0,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                  }
            }
            loop={!isSwiperLocked && sortedSubcategories.length > 1}
            resistanceRatio={0}
            watchOverflow
            grabCursor
            className="category-collection-swiper relative z-10 !pb-1"
            slidesOffsetBefore={0}
            slidesOffsetAfter={0}
            breakpoints={{
              0: { spaceBetween: 12 },
              1024: { spaceBetween: 16 },
            }}
          >
            {sortedSubcategories.map((sub, index) => (
              <SwiperSlide
                key={sub._id}
                className="!w-[78vw] sm:!w-[300px] lg:!w-[calc((100%-3rem)/4)] lg:max-w-[300px]"
              >
                <Link
                  href={`/shop/collections/sarees/${encodeURIComponent(sub.slug)}`}
                  className="group block w-full"
                >
                  <div className="border border-[#c5a059]/35 bg-white lg:border-[#c5a059]/50">
                    <div
                      className="relative overflow-hidden bg-gray-100"
                      style={{ aspectRatio: "3/4" }}
                    >
                      <Image
                        src={sub.image || "/placeholder-collection.png"}
                        alt={sub.name}
                        fill
                        loader={cloudinaryLoader}
                        sizes="(max-width: 1024px) 82vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        quality={index === 0 ? 72 : 65}
                        decoding={index === 0 ? "sync" : "async"}
                      />

                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center sm:pb-5 lg:pb-6">
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white sm:text-xs lg:text-[11px]">
                          {sub.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
