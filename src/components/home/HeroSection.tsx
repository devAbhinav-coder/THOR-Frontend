"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storefrontApi } from "@/lib/api";
import { HeroSlide } from "@/types";
import { cn } from "@/lib/utils";

const fallbackSlides: HeroSlide[] = [
  {
    title: "Elegance in Every Thread",
    subtitle: "New Silk Saree Collection",
    description:
      "Discover our handwoven Banarasi and Kanjeevaram silk sarees — timeless beauty for every occasion.",
    ctaText: "Shop Sarees",
    ctaLink: "/shop?category=Sarees",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    badge: "New Collection",
  },
  {
    title: "Bridal Dreams Come True",
    subtitle: "Exclusive Lehenga Collection",
    description:
      "Make your special day unforgettable with our exquisite bridal lehengas, crafted for the modern bride.",
    ctaText: "Explore Lehengas",
    ctaLink: "/shop?category=Lehengas",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
    badge: "Bridal 2025",
  },
  {
    title: "Casual Chic Every Day",
    subtitle: "Designer Kurtis & Suits",
    description:
      "Effortlessly stylish kurtis and salwar suits for every mood and every moment of your day.",
    ctaText: "Shop Now",
    ctaLink: "/shop?category=Kurtis",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop",
    image:
      "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=1200&q=80",
    badge: "Best Sellers",
  },
];

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => {
        const incoming = res.data?.settings?.heroSlides || [];
        const activeSlides = incoming.filter(
          (s: HeroSlide) => s.isActive !== false && s.image && s.title,
        );
        setSlides(activeSlides.length > 0 ? activeSlides : fallbackSlides);
      })
      .catch(() => {
        setSlides(fallbackSlides);
      })
      .finally(() => setIsLoaded(true));
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

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prev = () =>
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  const next = () => goToSlide((currentSlide + 1) % slides.length);

  const slide = slides[currentSlide] || fallbackSlides[0];

  if (!isLoaded && slides.length === 0) return null;
  if (!slide || slides.length === 0) return null;

  return (
    <section className='relative h-[88vh] min-h-[520px] overflow-hidden bg-navy-950'>
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
            priority={i === 0}
            sizes='100vw'
            className='object-cover object-center'
          />
          {/* Navy-to-transparent overlay — keeps brand feel */}
          <div className='absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-900/50 to-transparent' />
          <div className='absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent' />
        </div>
      ))}

      <div className='relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center'>
        <div className='max-w-xl animate-fadeIn'>
          {slide.badge && (
            <span className='inline-flex items-center gap-1.5 bg-brand-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest shadow-lg'>
              <span className='w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse' />
              {slide.badge}
            </span>
          )}
          {slide.subtitle && (
            <p className='text-gold-400 font-medium mb-2 text-base tracking-wide'>
              {slide.subtitle}
            </p>
          )}
          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-5 drop-shadow-lg'>
            {slide.title}
          </h1>
          {slide.description && (
            <p className='text-white/70 text-lg mb-8 leading-relaxed'>
              {slide.description}
            </p>
          )}
          <div className='flex flex-wrap gap-3'>
            <Button
              asChild
              size='xl'
              className='bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-900/40'
            >
              <Link href={slide.ctaLink || "/shop"}>
                <ShoppingBag className='h-5 w-5 mr-2' />
                {slide.ctaText || "Shop Now"}
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
              size='xl'
              className='border-white bg-white text-navy-900 hover:bg-gray-100 hover:border-white shadow-sm'
            >
              <Link href={slide.secondaryCtaLink || "/shop"}>
                {slide.secondaryCtaText || "View All"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <button
        onClick={prev}
        className='absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-navy-800/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-brand-700/70 transition-colors'
        aria-label='Previous slide'
      >
        <ChevronLeft className='h-5 w-5' />
      </button>
      <button
        onClick={next}
        className='absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-navy-800/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-brand-700/70 transition-colors'
        aria-label='Next slide'
      >
        <ChevronRight className='h-5 w-5' />
      </button>

      <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2'>
        {slides.map((_, i) => (
          <button
            key={i}
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
