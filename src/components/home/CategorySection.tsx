"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay } from "swiper/modules";
import { categoryApi } from "@/lib/api";
import { isGiftCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { Category } from "@/types";

import "swiper/css";
import CategorySectionSkeleton from "@/components/home/CategorySectionSkeleton";

const TRANSITION_MS = 5200;

const FALLBACK_IMAGES: Record<string, string> = {
  saree: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85",
  leheng:
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=85",
  salwar:
    "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=600&q=85",
  suit: "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=600&q=85",
  kurti:
    "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=85",
  dupatta:
    "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600&q=85",
  blouse:
    "https://images.unsplash.com/photo-1603217039863-aa0c865404f7?w=600&q=85",
  accessor:
    "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&q=85",
};

function getImageForCategory(cat: Category): string {
  if (cat.image) return cat.image;
  const lower = String(cat.name || "").toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85";
}

function sortSareeFirst(a: Category, b: Category): number {
  const aName = String(a.name || "");
  const bName = String(b.name || "");
  const aS = /saree|sari/i.test(aName) ? 0 : 1;
  const bS = /saree|sari/i.test(bName) ? 0 : 1;
  if (aS !== bS) return aS - bS;
  return aName.localeCompare(bName);
}

type CategorySectionProps = {
  /** Server-prefetched list; `null` = prefetch failed, client will fetch. */
  initialCategories?: (Category & { productCount: number })[] | null;
};

/* ── Main Section ────────────────────────────────────────── */
export default function CategorySection({
  initialCategories,
}: CategorySectionProps = {}) {
  const router = useRouter();
  const [categories, setCategories] = useState<
    (Category & { productCount: number })[]
  >(() => (Array.isArray(initialCategories) ? initialCategories : []));
  const [loading, setLoading] = useState(
    () => !Array.isArray(initialCategories),
  );
  const [swiperReady, setSwiperReady] = useState<SwiperType | null>(null);
  const [isSwiperLocked, setIsSwiperLocked] = useState(false);

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
    list.sort(sortSareeFirst);
    return list;
  }, [categories]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      filteredCategories.slice(0, 10).forEach((cat) => {
        router.prefetch(buildShopCategoryHref(cat));
      });
    }, 250);
    return () => window.clearTimeout(id);
  }, [filteredCategories, router]);

  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    setSwiperReady(swiper);
    setIsSwiperLocked(swiper.isLocked);
  }, []);

  const handleSwiperLock = useCallback(() => {
    setIsSwiperLocked(true);
  }, []);

  const handleSwiperUnlock = useCallback(() => {
    setIsSwiperLocked(false);
  }, []);

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

  if (loading) return <CategorySectionSkeleton />;

  if (filteredCategories.length === 0) {
    return (
      <section className='py-16 bg-[#faf9f7]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-6'>
            <p className='text-brand-600 font-semibold uppercase tracking-[0.22em] text-[11px] sm:text-xs'>
              Explore Collections
            </p>
            <div className='mt-2 mb-3 h-px w-24 bg-brand-200' />
            <h2 className='text-3xl sm:text-4xl font-serif text-navy-900'>
              Shop by <span className='italic text-brand-700'>Category</span>
            </h2>
          </div>
          <div className='flex flex-col items-start gap-3 py-12'>
            <Tag className='w-12 h-12 text-gray-300' />
            <p className='text-sm text-gray-400'>
              Categories will appear here once added from the admin panel.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-12 sm:py-14 bg-[#FAF9F6]'>
      <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8'>
        <div className='mb-8 sm:mb-10'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-3 text-brand-600'>
              <span className='h-px w-12 bg-brand-200 sm:w-16' />
              <p className='font-semibold uppercase tracking-[0.22em] text-[11px] sm:text-xs'>
                Explore Collections
              </p>
              <span className='h-px w-12 bg-brand-200 sm:w-16' />
            </div>
            <h2 className='mt-3 text-3xl sm:text-5xl font-serif text-navy-900'>
              Shop by <span className='text-brand-700'>Category</span>
            </h2>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-[30px] px-2 py-3 sm:px-3 sm:py-4 min-h-[380px] sm:min-h-[460px] lg:min-h-[510px] ${
            isSwiperLocked ? "[&_.swiper-wrapper]:justify-center" : ""
          }`}
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
          onPointerDown={pauseAuto}
          onPointerUp={resumeAuto}
          onPointerCancel={resumeAuto}
        >
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
            slidesPerView='auto'
            spaceBetween={16}
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
            loop={!isSwiperLocked && filteredCategories.length > 1}
            resistanceRatio={0}
            watchOverflow
            grabCursor
            className='category-collection-swiper relative z-10 !pb-1'
            slidesOffsetBefore={4}
            slidesOffsetAfter={4}
          >
            {filteredCategories.map((cat, index) => {
              const imgSrc = getImageForCategory(cat);
              return (
                <SwiperSlide
                  key={cat._id}
                  className='!w-[270px] sm:!w-[330px] lg:!w-[370px]'
                >
                  <Link
                    href={buildShopCategoryHref(cat)}
                    className='group block w-full'
                  >
                    <div
                      className={`relative overflow-hidden rounded-2xl transition-transform duration-500 ${
                        index % 2 === 0
                          ? "lg:rotate-[-0.6deg] group-hover:rotate-0"
                          : "lg:rotate-[0.6deg] group-hover:rotate-0"
                      }`}
                      style={{ aspectRatio: "3/4", background: "#f0ebe4" }}
                    >
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        sizes='(max-width: 640px) 270px, (max-width: 1024px) 330px, 370px'
                        className='object-contain transition-transform duration-700 group-hover:scale-102'
                        priority={index < 4}
                      />
                      <div className='absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/45 to-transparent' />
                      <div className='absolute bottom-0 left-0 right-0 p-4 sm:p-5'>
                        <h3 className='text-white font-serif font-medium text-2xl leading-tight'>
                          {cat.name}
                        </h3>
                        {/* {cat.productCount > 0 && (
                          <p className='text-white/80 text-[11px] mt-1 tracking-[0.14em] uppercase'>
                            {cat.productCount}+ Designs
                          </p>
                        )} */}
                        {cat.productCount === 0 && (
                          <p className='text-white/55 text-xs mt-0.5 tracking-wide'>
                            Coming soon
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
