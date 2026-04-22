"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroSlide } from "@/types";
import { cn } from "@/lib/utils";

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
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            unoptimized
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "low"}
            sizes='100vw'
            quality={i === 0 ? 68 : 72}
            className='object-cover object-[center_top]'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10' />
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
            <p className='hidden sm:block text-white/90 text-xs sm:text-lg mb-4 sm:mb-8 leading-relaxed line-clamp-2 sm:line-clamp-none'>
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

      <div className='absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2'>
        {slides.map((_, i) => (
          <button
            key={i}
            type='button'
            onClick={() => goToSlide(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === currentSlide ? "w-8 bg-brand-500" : (
                "w-2 bg-white/30 hover:bg-white/60"
              ),
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(HeroSection);
