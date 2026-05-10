"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroSlide } from "@/types";
import { cn } from "@/lib/utils";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

let hasPlayedHeroTextEntrance = false;

type Props = {
  /** From server fetch — LCP image must not wait on client /settings request */
  initialSlides: HeroSlide[];
};

function HeroSection({ initialSlides }: Props) {
  /** Must track prop updates — `useState(initialSlides)` only used the first SSR payload. */
  const slides = initialSlides;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [playEntrance, setPlayEntrance] = useState(false);

  useEffect(() => {
    if (hasPlayedHeroTextEntrance) return;
    const id = window.requestAnimationFrame(() => {
      setPlayEntrance(true);
      hasPlayedHeroTextEntrance = true;
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const slide = slides[currentSlide] ?? slides[0];
  if (!slide || slides.length === 0) return null;

  return (
    <section className='relative h-[min(42svh,320px)] sm:h-[min(80svh,700px)] overflow-hidden bg-navy-950'>
      {slides.map((s, i) => (
        <div
          key={`${s.image}-${s.title}-${i}`}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === currentSlide ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={i === currentSlide ? "false" : "true"}
        >
          <Image
            src={s.image}
            alt={s.title || "House of Rani — featured collection"}
            fill
            // Custom loader rewrites Cloudinary URLs through `f_auto,q_auto,w_<n>`
            // so the browser receives AVIF/WebP at the rendered width — fixes
            // the 1.9 MB Lighthouse "Improve image delivery" finding.
            loader={cloudinaryLoader}
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "low"}
            // Only the first slide is decoded synchronously (it's the LCP);
            // others can decode lazily so they don't fight the LCP for CPU.
            decoding={i === 0 ? "sync" : "async"}
            loading={i === 0 ? "eager" : "lazy"}
            sizes='100vw'
            quality={i === 0 ? 65 : 60}
            className='object-cover object-[center_top]'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/15' />
        </div>
      ))}

      <div className='relative h-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center pt-3 '>
        <div
          className={cn(
            "max-w-xl",
            playEntrance && "motion-safe:animate-hero-text-in",
          )}
        >
          {slide.badge && (
            <span className='inline-flex items-center gap-1.5 bg-brand-600/90 text-white text-[9px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full mb-1.5 sm:mb-5 uppercase tracking-widest shadow-lg'>
              <span className='w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse' />
              {slide.badge}
            </span>
          )}
          {slide.subtitle && (
            <p className='text-gold-300 font-medium mb-1 sm:mb-2 text-[11px] sm:text-base tracking-wide'>
              {slide.subtitle}
            </p>
          )}
          <h1 className='text-lg sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-1 sm:mb-5 drop-shadow-lg'>
            {slide.title}
          </h1>
          {slide.description && (
            <p className='hidden sm:block text-white text-xs sm:text-lg mb-4 sm:mb-8 leading-relaxed line-clamp-2 sm:line-clamp-none drop-shadow'>
              {slide.description}
            </p>
          )}
          <div className='flex flex-wrap gap-1.5 sm:gap-3'>
            <Button
              asChild
              size='sm'
              className='sm:hidden bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-900/40 px-2.5 py-1.5 text-[11px]'
            >
              <Link href={slide.ctaLink || "/shop"}>
                <ShoppingBag className='h-3.5 w-3.5 mr-1' />
                {slide.ctaText || "Shop Now"}
              </Link>
            </Button>
            <Button
              asChild
              size='xl'
              className='hidden sm:inline-flex bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-900/40'
            >
              <Link href={slide.ctaLink || "/shop"}>
                <ShoppingBag className='h-5 w-5 mr-2' />
                {slide.ctaText || "Shop Now"}
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
              size='sm'
              className='sm:hidden border-white bg-white text-navy-900 hover:bg-gray-100 hover:border-white shadow-sm px-2.5 py-1.5 text-[11px]'
            >
              <Link href={slide.secondaryCtaLink || "/shop"}>
                {slide.secondaryCtaText || "View All"}
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
              size='xl'
              className='hidden sm:inline-flex border-white bg-white text-navy-900 hover:bg-gray-100 hover:border-white shadow-sm'
            >
              <Link href={slide.secondaryCtaLink || "/shop"}>
                {slide.secondaryCtaText || "View All"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div
          className='absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1'
          role='tablist'
          aria-label='Hero slides'
        >
          {slides.map((s, i) => {
            const isActive = i === currentSlide;
            return (
              <button
                key={i}
                type='button'
                role='tab'
                aria-selected={isActive}
                aria-current={isActive ? "true" : undefined}
                aria-label={`Show slide ${i + 1} of ${slides.length}${s.title ? `: ${s.title}` : ""}`}
                onClick={() => goToSlide(i)}
                className={cn(
                  "group relative inline-flex items-center justify-center",
                  // 28×28 hit area (>= WCAG 24×24); the visible pill is centered inside.
                  "h-7 w-7 sm:h-8 sm:w-8 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30",
                )}
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-all duration-300",
                    isActive ? "w-8 bg-brand-500" : (
                      "w-2 bg-white/60 group-hover:bg-white/90"
                    ),
                  )}
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default memo(HeroSection);
