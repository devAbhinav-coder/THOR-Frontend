"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag, ArrowRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { categoryApi } from "@/lib/api";
import { Category } from "@/types";

import "swiper/css";

const PAUSE_MS = 1500;
const TRANSITION_MS = 650;

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

function isGiftCategory(cat: Category): boolean {
  if (cat.isGiftCategory) return true;
  const name = String(cat.name || "").toLowerCase();
  const slug = (cat.slug || "").toLowerCase();
  return (
    name.includes("gift") || name.includes("gifting") || slug.includes("gift")
  );
}

function sortSareeFirst(a: Category, b: Category): number {
  const aName = String(a.name || "");
  const bName = String(b.name || "");
  const aS = /saree|sari/i.test(aName) ? 0 : 1;
  const bS = /saree|sari/i.test(bName) ? 0 : 1;
  if (aS !== bS) return aS - bS;
  return aName.localeCompare(bName);
}

/* ── Skeleton ────────────────────────────────────────────── */
function CategorySkeleton() {
  return (
    <section className='py-16 bg-[#faf9f7]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-10'>
          <div className='h-3 w-24 bg-gray-200 rounded-full animate-pulse mx-auto mb-3' />
          <div className='h-8 w-60 bg-gray-200 rounded-full animate-pulse mx-auto' />
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className='aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse'
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Main Section ────────────────────────────────────────── */
export default function CategorySection() {
  const [categories, setCategories] = useState<
    (Category & { productCount: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [swiperReady, setSwiperReady] = useState<SwiperType | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const userPauseRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    categoryApi
      .getStats()
      .then((res) =>
        setCategories(
          (((res.data as { categories: Category[] }).categories || []).filter(
            (c): c is Category =>
              !!c && typeof c === "object" && typeof c.name === "string" && c.name.trim().length > 0,
          )),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    const list = categories.filter((c) => !isGiftCategory(c));
    list.sort(sortSareeFirst);
    return list;
  }, [categories]);

  const clearSchedule = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const schedulePingPong = useCallback(
    (swiper: SwiperType, immediateDelay: number) => {
      clearSchedule();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        const reduceMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (userPauseRef.current || reduceMotion) {
          schedulePingPong(swiper, PAUSE_MS);
          return;
        }
        if (swiper.destroyed || swiper.isLocked) return;

        let dir = directionRef.current;
        if (dir === 1 && swiper.isEnd) directionRef.current = -1;
        else if (dir === -1 && swiper.isBeginning) directionRef.current = 1;
        dir = directionRef.current;

        if (dir === 1) swiper.slideNext(TRANSITION_MS);
        else swiper.slidePrev(TRANSITION_MS);
      }, immediateDelay);
    },
    [clearSchedule],
  );

  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    setSwiperReady(swiper);
  }, []);

  useEffect(() => {
    const swiper = swiperReady;
    if (!swiper || filteredCategories.length <= 1) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const onTransitionEnd = () => {
      if (swiper.destroyed) return;
      schedulePingPong(swiper, PAUSE_MS);
    };

    swiper.on("slideChangeTransitionEnd", onTransitionEnd);
    directionRef.current = 1;

    if (!swiper.isLocked) {
      schedulePingPong(swiper, PAUSE_MS);
    }

    return () => {
      swiper.off("slideChangeTransitionEnd", onTransitionEnd);
      clearSchedule();
    };
  }, [swiperReady, filteredCategories.length, schedulePingPong, clearSchedule]);

  useEffect(() => {
    return () => {
      clearSchedule();
    };
  }, [clearSchedule]);

  const pauseAuto = useCallback(() => {
    userPauseRef.current = true;
    clearSchedule();
  }, [clearSchedule]);

  const resumeAuto = useCallback(() => {
    userPauseRef.current = false;
    const s = swiperReady;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
      !s ||
      s.destroyed ||
      s.isLocked ||
      reduceMotion ||
      filteredCategories.length <= 1
    )
      return;
    clearSchedule();
    schedulePingPong(s, PAUSE_MS);
  }, [swiperReady, clearSchedule, schedulePingPong, filteredCategories.length]);

  if (loading) return <CategorySkeleton />;

  if (filteredCategories.length === 0) {
    return (
      <section className='py-16 bg-[#faf9f7]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-brand-600 font-semibold uppercase tracking-widest text-xs mb-2'>
            Browse by Category
          </p>
          <h2 className='text-3xl sm:text-4xl font-serif font-bold text-navy-900 mb-6'>
            Shop Our Collections
          </h2>
          <div className='flex flex-col items-center gap-3 py-12'>
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
    <section className='py-6 sm:py-6 bg-[#faf9f7]'>
      <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8'>
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-8'>
          <div>
            <p className='text-brand-600 font-semibold uppercase tracking-widest text-xs sm:text-sm mb-1'>
              Browse by Category
            </p>
            <h2 className='text-2xl sm:text-4xl font-serif font-bold text-navy-900'>
              Shop Our Collections
            </h2>
          </div>
          <Link
            href='/shop'
            className='inline-flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors group'
          >
            View All
            <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
          </Link>
        </div>

        <div
          className='relative'
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
          onPointerDown={pauseAuto}
          onPointerUp={resumeAuto}
          onPointerCancel={resumeAuto}
        >
          <Swiper
            onSwiper={handleSwiperInit}
            slidesPerView='auto'
            spaceBetween={16}
            speed={TRANSITION_MS}
            resistanceRatio={0.65}
            watchOverflow
            grabCursor
            className='category-collection-swiper !pb-1'
            slidesOffsetBefore={4}
            slidesOffsetAfter={4}
          >
            {filteredCategories.map((cat, index) => {
              const imgSrc = getImageForCategory(cat);
              return (
                <SwiperSlide
                  key={cat._id}
                  className='!w-[150px] sm:!w-[160px] lg:!w-[200px]'
                >
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className='group block w-full'
                  >
                    <div
                      className='relative overflow-hidden rounded-xl'
                      style={{ aspectRatio: "3/4", background: "#f0ebe4" }}
                    >
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        sizes='(max-width: 640px) 150px, (max-width: 1024px) 160px, 200px'
                        className='object-contain transition-transform duration-500 group-hover:scale-105'
                        priority={index < 4}
                      />
                      <div className='absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent' />
                      <div className='absolute bottom-0 left-0 right-0 p-3 sm:p-4'>
                        <h3 className='text-white font-serif font-semibold text-sm sm:text-base leading-snug'>
                          {cat.name}
                        </h3>
                        {cat.productCount > 0 && (
                          <p className='text-white/70 text-xs mt-0.5'>
                            {cat.productCount}{" "}
                            {cat.productCount === 1 ? "product" : "products"}
                          </p>
                        )}
                        {cat.productCount === 0 && (
                          <p className='text-white/50 text-xs mt-0.5'>
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
