"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { storefrontApi } from "@/lib/api";
import type { HomeGiftShowcaseCard, StorefrontSettings } from "@/types";
import { cn } from "@/lib/utils";
import { resolveHomeGiftShopButton } from "@/lib/homeGiftShopLink";
import { Gift, Heart, Sparkles, Star } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ACCENT_BG: Record<string, string> = {
  rose: "bg-gradient-to-b from-rose-200 via-rose-100 to-rose-300",
  amber: "bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200",
  sage: "bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200",
};

export default function HomeGiftShowcase() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const section = settings?.homeGiftShowcase;
  const rawCards = section?.cards || [];
  const cards = rawCards.filter(
    (c: HomeGiftShowcaseCard) =>
      (c?.title && c.title.trim()) ||
      (c?.description && c.description.trim()) ||
      (c?.image && c.image.trim()),
  );

  useLayoutEffect(() => {
    if (!section?.isActive || cards.length === 0) return;

    const ctx = gsap.context(() => {
      let mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const cardElements = gsap.utils.toArray<HTMLElement>(
          ".gift-card-stack-item",
        );

        // Initial positioning: make it feel like they are coming from below
        cardElements.forEach((card, index) => {
          if (index === 0) {
            // First card starts a bit lower so it can slide up into view
            gsap.set(card, {
              y: window.innerHeight * 0.4,
              scale: 1,
              opacity: 1,
              zIndex: 1,
            });
          } else {
            // Others start completely off-screen below
            gsap.set(card, {
              y: window.innerHeight + 200,
              scale: 0.9,
              opacity: 0,
              zIndex: index + 1,
            });
          }
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom", // Scroll natively handles the duration based on section height
            scrub: 1,
          },
        });

        // Animate title drifting downwards as you scroll
        tl.fromTo(
          ".gift-title-container",
          {
            y: -80,
            opacity: 1,
          },
          {
            y: 120, // Moves down significantly
            opacity: 1,
            duration: cards.length * 1.5, // Spans the whole scroll
            ease: "none",
          },
          0,
        );

        // Parallax moving background decor
        for (let i = 1; i <= 12; i++) {
          tl.to(
            `.bg-decor-${i}`,
            { 
              y: -200 - (i * 30), 
              rotation: i % 2 === 0 ? 180 : -180, 
              duration: 4, 
              ease: "none" 
            },
            0,
          );
        }

        // First card slides to top position
        tl.to(
          cardElements[0],
          {
            y: 80, // Stops lower than before
            duration: 1,
            ease: "power2.out",
          },
          0,
        );

        // Animate each subsequent card sliding up and stacking
        cardElements.forEach((card, index) => {
          if (index === 0) return; // Handled above

          const offset = 24; // Pixel offset for stacking effect

          tl.to(
            card,
            {
              y: 80 + index * offset, // Final piled position, lower on screen
              scale: 1, // Full size when stacked
              opacity: 1,
              duration: 1.2,
              ease: "power2.out",
            },
            index * 1.3 // Starts just after the previous card has fully settled
          );
        });
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [section?.isActive, cards.length]);

  if (!section?.isActive || cards.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className='relative bg-[#FAF9F6] w-full z-20 md:h-[calc(var(--card-count)*80vh+100vh)] py-12 md:py-0'
      style={{ "--card-count": cards.length } as React.CSSProperties}
    >
      <div
        ref={containerRef}
        className='md:sticky top-0 left-0 w-full md:h-[100dvh] md:max-h-[1000px] md:min-h-[500px] overflow-hidden flex flex-col items-center justify-center'
      >
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 pt-4 pb-4'>
          {/* Moving Background Decor */}
          <div className='pointer-events-none absolute inset-0 opacity-[0.25] overflow-hidden'>
            <Gift className='bg-decor-1 absolute left-[8%] top-[10%] h-8 w-8 text-rose-400 opacity-60' />
            <Heart className='bg-decor-2 absolute left-[15%] bottom-[15%] h-6 w-6 text-amber-400 opacity-60' />
            <Sparkles className='bg-decor-3 absolute right-[10%] top-[20%] h-10 w-10 text-emerald-400 opacity-60' />
            <Star className='bg-decor-4 absolute right-[8%] bottom-[15%] h-7 w-7 text-rose-300 opacity-60' />
            
            <Heart className='bg-decor-5 absolute left-[30%] top-[25%] h-5 w-5 text-rose-500 opacity-40' />
            <Sparkles className='bg-decor-6 absolute right-[35%] bottom-[30%] h-6 w-6 text-amber-500 opacity-50' />
            <Gift className='bg-decor-7 absolute left-[45%] bottom-[10%] h-9 w-9 text-rose-300 opacity-40' />
            <Star className='bg-decor-8 absolute right-[25%] top-[8%] h-5 w-5 text-emerald-300 opacity-50' />
            
            <Sparkles className='bg-decor-9 absolute left-[20%] top-[50%] h-7 w-7 text-amber-300 opacity-50' />
            <Heart className='bg-decor-10 absolute right-[15%] top-[60%] h-8 w-8 text-rose-400 opacity-40' />
            <Gift className='bg-decor-11 absolute left-[40%] top-[70%] h-6 w-6 text-emerald-400 opacity-60' />
            <Star className='bg-decor-12 absolute right-[45%] top-[40%] h-9 w-9 text-rose-200 opacity-50' />
            

            <Sparkles className='bg-decor-13 absolute left-[10%] bottom-[30%] h-7 w-7 text-amber-300 opacity-50' />
            <Heart className='bg-decor-14 absolute right-[15%] top-[60%] h-8 w-8 text-rose-400 opacity-40' />
            <Gift className='bg-decor-15 absolute left-[10%] top-[80%] h-6 w-6 text-emerald-400 opacity-60' />
            <Star className='bg-decor-16 absolute right-[35%] top-[70%] h-9 w-9 text-rose-200 opacity-50' />
          </div>

          {/* Left Side: Sticky Title */}
          <div className='gift-title-container w-full md:w-5/12 flex flex-col justify-center text-center md:text-left z-10 pt-10 md:pt-0'>
          {section.headlineLine1 && (
            <p className='text-lg font-bold tracking-tight text-rose-500 sm:text-xl md:text-2xl mb-2 sm:mb-4 uppercase tracking-widest'>
              {section.headlineLine1}
            </p>
          )}
          {section.headlineLine2 && (
            <h2 className='font-sans text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-7xl'>
              {section.headlineLine2}
            </h2>
          )}
          {section.description && (
            <p className='mt-4 sm:mt-6 text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg max-w-lg mx-auto md:mx-0'>
              {section.description}
            </p>
          )}

          {section.socialHandle?.trim() && (
            <Link href='/gifting'>
              <div className='mt-4 sm:mt-8 md:mt-12 flex justify-center md:justify-start'>
                <span className='inline-flex items-center rounded-full bg-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-900/5 hover:bg-gray-50 transition'>
                  {section.socialHandle.trim()}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Right Side: Stacked Cards */}
        <div className='w-full md:w-6/12 relative md:h-[600px] flex flex-col md:block items-center md:perspective-[1200px] mt-2 md:mt-0'>
          <div className='w-full max-w-[300px] sm:max-w-[340px] md:max-w-sm flex flex-col md:block gap-6 md:gap-0 relative md:h-[480px] mx-auto md:ml-auto md:mr-0'>
            {cards.map((card, index) => {
              const accent =
                card.accent && ACCENT_BG[card.accent] ? card.accent : "rose";

              return (
                <div
                  key={`${card.title}-${index}`}
                  className={cn(
                    "gift-card-stack-item flex flex-col rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 text-center shadow-lg md:shadow-2xl border border-white/60 md:will-change-transform",
                    "relative md:absolute md:top-0 md:left-0 md:w-full md:h-full",
                    ACCENT_BG[accent],
                  )}
                  style={{ transformOrigin: "top center" }}
                >
                  <div className='group relative mx-auto mb-4 sm:mb-5 w-full h-[180px] sm:h-48 shrink-0 overflow-hidden rounded-[1rem] sm:rounded-[1.5rem] shadow-md border-2 border-white/50'>
                    {card.image ?
                      <Image
                        src={card.image}
                        alt={card.title || "Gift category"}
                        fill
                        className='object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer'
                        sizes='(max-width: 640px) 100vw, 320px'
                      />
                    : <div className='flex h-full w-full items-center justify-center bg-white/50 text-sm font-medium text-gray-500'>
                        Add image
                      </div>
                    }
                  </div>
                  {card.title && (
                    <h3 className='font-serif text-xl sm:text-3xl font-bold leading-tight text-gray-900 drop-shadow-sm mb-1 sm:mb-3'>
                      {card.title}
                    </h3>
                  )}
                  {card.description && (
                    <p className='line-clamp-2 sm:line-clamp-3 flex-1 text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-gray-800 font-medium px-1 sm:px-2'>
                      {card.description}
                    </p>
                  )}

                  <div className='mt-auto flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-6'>
                    {(() => {
                      const shop = resolveHomeGiftShopButton(card);
                      if (!shop) return null;
                      if (shop.kind === "coming_soon") {
                        return (
                          <span className='rounded-xl sm:rounded-2xl border border-white/70 bg-white/40 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-bold text-gray-900 shadow-sm'>
                            {shop.label}
                          </span>
                        );
                      }
                      const external = /^https?:\/\//i.test(shop.href);
                      return external ?
                          <a
                            href={shop.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='rounded-xl sm:rounded-2xl bg-white px-3 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-bold text-gray-900 shadow-lg ring-1 ring-gray-900/5 transition-all hover:scale-[1.02] active:scale-[0.98]'
                          >
                            {shop.label}
                          </a>
                        : <Link
                            href={shop.href}
                            className='rounded-xl sm:rounded-2xl bg-white px-3 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-bold text-gray-900 shadow-lg ring-1 ring-gray-900/5 transition-all hover:scale-[1.02] active:scale-[0.98]'
                          >
                            {shop.label}
                          </Link>;
                    })()}
                    {card.giftButtonLink && (
                      <Link
                        href={card.giftButtonLink}
                        className='rounded-lg sm:rounded-xl border-2 border-white/80 bg-transparent px-2 py-1.5 sm:px-2.5 sm:py-2 text-center text-[10px] sm:text-[11px] font-bold text-gray-900 transition hover:bg-white/15'
                      >
                        {card.giftButtonText || "Gifting"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
