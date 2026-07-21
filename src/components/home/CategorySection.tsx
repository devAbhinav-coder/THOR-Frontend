"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import { categoryApi } from "@/lib/api";
import { isGiftCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import {
  resolveGiftingCard,
  resolveSaleCard,
} from "@/lib/shopSpecialCollections";
import { Category, HomeExploreHouse } from "@/types";
import CategorySectionSkeleton from "@/components/home/CategorySectionSkeleton";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGES: Record<string, string> = {
  saree: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85",
  leheng:
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=85",
};

function getImageForCategory(cat: Category): string {
  if (cat.image) return cat.image;
  const lower = String(cat.name || "").toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85";
}

type CategorySectionProps = {
  initialCategories?: (Category & { productCount: number })[] | null;
  exploreHouseImages?: HomeExploreHouse | null;
};

function categorySubtitle(productCount?: number): string {
  return (productCount ?? 0) > 0 ? "" : "COMING SOON";
}

type ExploreHouseCard = {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  image: string;
  comingSoon?: boolean;
};

export default function CategorySection({
  initialCategories,
  exploreHouseImages,
}: CategorySectionProps = {}) {
  const [categories, setCategories] = useState<
    (Category & { productCount: number })[]
  >(() => (Array.isArray(initialCategories) ? initialCategories : []));
  const [loading, setLoading] = useState(
    () => !Array.isArray(initialCategories),
  );

  const [swiperReady, setSwiperReady] = useState<SwiperType | null>(null);
  const [isSwiperLocked, setIsSwiperLocked] = useState(false);

  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    setSwiperReady(swiper);
    setIsSwiperLocked(swiper.isLocked);
  }, []);

  const handleSwiperLock = useCallback(() => setIsSwiperLocked(true), []);
  const handleSwiperUnlock = useCallback(() => setIsSwiperLocked(false), []);

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

  useEffect(() => {
    if (Array.isArray(initialCategories)) {
      setCategories(initialCategories);
      setLoading(false);
      return;
    }
    categoryApi
      .getStats()
      .then((res) =>
        setCategories(
          ((res.data as { categories: Category[] }).categories || []).filter(
            (c): c is Category =>
              !!c &&
              typeof c === "object" &&
              typeof c.name === "string" &&
              c.name.trim().length > 0,
          ),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialCategories]);

  const filteredCategories = useMemo(() => {
    const list = categories.filter((c) => !isGiftCategory(c));
    list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return list;
  }, [categories]);

  const saleCard = useMemo(
    () => resolveSaleCard(exploreHouseImages),
    [exploreHouseImages],
  );

  const giftingCard = useMemo(
    () => resolveGiftingCard(categories, exploreHouseImages),
    [categories, exploreHouseImages],
  );

  const showcaseCards = useMemo<ExploreHouseCard[]>(() => {
    const catalogCards: ExploreHouseCard[] = filteredCategories.map((cat) => {
      const hasProducts = (cat.productCount ?? 0) > 0;
      return {
        id: cat._id,
        name: cat.name,
        subtitle: categorySubtitle(cat.productCount),
        href: buildShopCategoryHref(cat),
        image: getImageForCategory(cat),
        comingSoon: !hasProducts,
      };
    });

    return [saleCard, ...catalogCards, giftingCard];
  }, [filteredCategories, saleCard, giftingCard]);

  if (loading) return <CategorySectionSkeleton />;

  if (showcaseCards.length === 0) return null;

  return (
    <section className="bg-[#f9f9f9] py-4 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center justify-center text-center sm:mb-12">
          <h2 className="font-serif text-3xl text-[#1a1a1a] sm:text-4xl lg:text-[2.75rem] tracking-wide">
            Explore{" "}
            <span className="relative inline-block">
              Our
              <span className="absolute -bottom-2 left-0 right-0 h-[1px] bg-[#c5a059]" />
            </span>{" "}
            House
          </h2>
        </div>

        <div
          data-lenis-prevent-horizontal
          className={cn(
            "relative min-h-[230px] overflow-hidden sm:min-h-[420px] lg:min-h-[480px]",
            isSwiperLocked && "[&_.swiper-wrapper]:justify-center"
          )}
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
          onPointerDown={pauseAuto}
          onPointerUp={resumeAuto}
          onPointerCancel={resumeAuto}
        >
          <style jsx global>{`
            .explore-house-swiper .swiper-wrapper {
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
            loop={!isSwiperLocked && showcaseCards.length > 1}
            resistanceRatio={0}
            watchOverflow
            grabCursor
            className="explore-house-swiper relative z-10 !pb-1"
            slidesOffsetBefore={0}
            slidesOffsetAfter={0}
            breakpoints={{
              0: { spaceBetween: 12 },
              1024: { spaceBetween: 16 },
            }}
          >
            {showcaseCards.map((card, index) => {
              const content = (
                <div className="border border-[#c5a059]/35 bg-white lg:border-[#c5a059]/50">
                  <div
                    className="relative overflow-hidden bg-gray-100"
                    style={{ aspectRatio: "3/4" }}
                  >
                    <Image
                      src={card.image}
                      alt={card.name}
                      fill
                      loader={cloudinaryLoader}
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 300px, 25vw"
                      className={cn(
                        "object-cover transition-transform duration-700 ease-out",
                        !card.comingSoon && "group-hover:scale-[1.03]"
                      )}
                      priority={index < 4}
                      loading={index < 4 ? "eager" : "lazy"}
                    />
                    
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {card.comingSoon && (
                      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/20" />
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end px-2 pb-4 text-center text-white sm:px-4 sm:pb-5 lg:pb-6">
                      <h3 className="line-clamp-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white sm:text-xs lg:text-[11px]">
                        {card.name}
                      </h3>
                      {card.subtitle ? (
                        <p
                          className={cn(
                            "mt-1 max-w-full px-0.5 text-[8px] font-medium uppercase leading-[1.35] tracking-[0.12em] sm:text-[9px] sm:tracking-[0.16em]",
                            card.comingSoon ? "text-[#d4b87a]" : "text-[#ececec]"
                          )}
                        >
                          {card.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );

              return (
                <SwiperSlide
                  key={card.id}
                  className="!w-[44vw] sm:!w-[300px] lg:!w-[calc((100%-3rem)/4)] lg:max-w-[300px]"
                >
                  {card.comingSoon ? (
                    <div className="group block w-full overflow-hidden cursor-default" aria-label={`${card.name} — Coming soon`}>
                      {content}
                    </div>
                  ) : (
                    <Link href={card.href} className="group block w-full overflow-hidden">
                      {content}
                    </Link>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
