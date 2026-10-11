"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { HeroSlide } from "@/types";
import { cn } from "@/lib/utils";
import { getHeroSlideDisplayTitle } from "@/lib/pageHeadings";
import { heroLayout, heroSlideImageClass } from "@/lib/heroSectionLayout";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

let hasPlayedHeroTextEntrance = false;

const TRUST_SIGNALS = [
  "Authentic craftsmanship",
  "Pan-India delivery",
  "5-day easy returns",
] as const;

type Props = {
  initialSlides: HeroSlide[];
  announcementMessages?: readonly string[];
  underNavOverlap?: boolean;
};

function HeroSection({
  initialSlides,
  announcementMessages = [],
  underNavOverlap = false,
}: Props) {
  const slides = initialSlides;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [playEntrance, setPlayEntrance] = useState(false);
  const [revealAllSlides, setRevealAllSlides] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const offers = useMemo(
    () => announcementMessages.filter((m) => String(m || "").trim()),
    [announcementMessages],
  );

  const hasDescription = useMemo(
    () => slides.some((s) => Boolean(s.description?.trim())),
    [slides],
  );

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = window.setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % offers.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [offers.length]);

  useEffect(() => {
    if (hasPlayedHeroTextEntrance) return;
    const id = window.requestAnimationFrame(() => {
      setPlayEntrance(true);
      hasPlayedHeroTextEntrance = true;
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const reveal = () => setRevealAllSlides(true);
    const win = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(reveal, { timeout: 2500 });
      return () => {
        win.cancelIdleCallback?.(id);
      };
    }
    const timer = window.setTimeout(reveal, 1500);
    return () => window.clearTimeout(timer);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
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
    setTimeout(() => setIsAutoPlaying(true), 12000);
  }, []);

  const slide = slides[currentSlide] ?? slides[0];
  if (!slide || slides.length === 0) return null;

  const description = slide.description?.trim() || "";
  const headline = getHeroSlideDisplayTitle(slide.title);

  return (
    <section
      className={cn(
        heroLayout.section,
        underNavOverlap && heroLayout.sectionUnderNav,
      )}
    >
      <div className={heroLayout.media}>
        {slides.map((s, i) => {
          const shouldMount = i === 0 || revealAllSlides || i === currentSlide;
          const isActive = i === currentSlide;
          return (
            <div
              key={`${s.image}-${i}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1400ms] ease-out",
                isActive ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!isActive}
            >
              {shouldMount ?
                <Image
                  src={s.image}
                  alt={s.title || "The House of Rani - premium ethnic wear"}
                  fill
                  loader={cloudinaryLoader}
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding={i === 0 ? "sync" : "async"}
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes='100vw'
                  quality={i === 0 ? 68 : 62}
                  className={heroSlideImageClass}
                />
              : null}
            </div>
          );
        })}

        <div className={heroLayout.overlay} aria-hidden />
        <div className={heroLayout.bottomFade} aria-hidden />

        <div className={heroLayout.content}>
          <div className={heroLayout.inner}>
            <div
              className={cn(
                heroLayout.copyRow,
                playEntrance && "motion-safe:animate-hero-text-in",
              )}
            >
              <div className={heroLayout.titleCol}>
                <div className={cn(heroLayout.titleSlot, "overflow-hidden")}>
                  <h1
                    key={`title-${currentSlide}`}
                    className='motion-safe:animate-hero-copy-in font-serif text-lg font-medium leading-[1.14] tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1] [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]'
                  >
                    {headline}
                  </h1>
                </div>
              </div>

              <div className={heroLayout.rightCol}>
                {hasDescription && (
                  <div
                    className={cn(
                      heroLayout.descriptionSlot,
                      "hidden overflow-hidden sm:block",
                    )}
                  >
                    {description ?
                      <p
                        key={`desc-${currentSlide}`}
                        className='motion-safe:animate-hero-copy-in text-[11px] font-light leading-relaxed text-[#ece8e3] line-clamp-2 sm:text-sm sm:line-clamp-3 [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]'
                      >
                        {description}
                      </p>
                    : null}
                  </div>
                )}

                <div className={heroLayout.ctaSlot}>
                  <div
                    key={`cta-${currentSlide}`}
                    className='motion-safe:animate-hero-copy-in flex flex-col items-end gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-5 sm:gap-y-1.5 lg:gap-x-6'
                  >
                    <Link
                      href={slide.ctaLink || "/shop/collections"}
                      className='border-b border-white/65 pb-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-gold-200 hover:text-gold-100 sm:pb-1 sm:text-[10px] sm:tracking-[0.22em] lg:text-[11px]'
                    >
                      {slide.ctaText || "Explore collection"}
                    </Link>
                    <Link
                      href={slide.secondaryCtaLink || "/premium"}
                      className='text-[9px] font-medium uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white sm:text-[10px] sm:tracking-[0.22em] lg:text-[11px]'
                    >
                      {slide.secondaryCtaText || "Premium edit"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={heroLayout.bottomDock}>
          {offers.length > 0 && (
            <div className={heroLayout.offerStrip}>
              <p
                key={announcementIndex}
                className='motion-safe:animate-hero-copy-in text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gold-200/95 sm:text-[11px]'
              >
                {offers[announcementIndex]}
              </p>
            </div>
          )}

          <div className={heroLayout.footer}>
            <div className={heroLayout.footerRow}>
              <ul
                className='hidden flex-wrap gap-x-5 gap-y-1.5 text-[10px] uppercase tracking-[0.18em] text-white/80 sm:flex sm:gap-x-6 sm:text-[11px]'
                aria-label='Shopping benefits'
              >
                {TRUST_SIGNALS.map((signal, i) => (
                  <li key={signal} className='inline-flex items-center gap-5'>
                    {i > 0 && (
                      <span
                        className='hidden h-3 w-px bg-white/30 sm:inline-block'
                        aria-hidden
                      />
                    )}
                    {signal}
                  </li>
                ))}
              </ul>

              {slides.length > 1 && (
                <div
                  className='ml-auto flex shrink-0 items-center justify-end gap-2 sm:ml-0 sm:justify-start sm:gap-3'
                  role='tablist'
                  aria-label='Hero slides'
                >
                  <span className='text-[8px] tabular-nums tracking-[0.16em] text-white/70 sm:text-[10px] sm:tracking-[0.2em]'>
                    {String(currentSlide + 1).padStart(2, "0")}
                    <span className='mx-1 text-white/40 sm:mx-1.5'>/</span>
                    {String(slides.length).padStart(2, "0")}
                  </span>
                  <div className='flex gap-1 sm:gap-1.5'>
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
                          className='group relative h-5 w-5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 sm:h-8 sm:w-8'
                        >
                          <span
                            className={cn(
                              "absolute left-1/2 top-1/2 block h-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45 transition-[width,background-color] duration-500",
                              isActive ? "w-5 bg-gold-200 sm:w-8" : (
                                "w-2 group-hover:w-4 group-hover:bg-white/70 sm:w-3 sm:group-hover:w-5"
                              ),
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
