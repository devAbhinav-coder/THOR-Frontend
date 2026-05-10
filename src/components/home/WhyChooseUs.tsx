"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Gift,
  Sparkles,
  Award,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

// Make sure to import the image
import whyChooseUsImg from "@/assets/why-choose-us.png";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: ShieldCheck,
    title: "Authentic Ethnic Wear",
    description: "Premium handwoven sarees crafted with rich Indian heritage",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description: "Carefully curated fabrics, strict quality checks, and rich organic dyes",
  },
  {
    icon: Gift,
    title: "Handmade Gifting",
    description: "Thoughtful, personalized gifts curated for every special moment",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on orders above ₹1099 across India",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day hassle-free returns and exchanges",
  },
  {
    icon: Sparkles,
    title: "Customizable Hampers",
    description: "Add names, messages, and personal touches to your gifts",
  },
];

export default function WhyChooseUs() {
  const containerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      let mm = gsap.matchMedia();

      // Desktop: Pin the section and stagger reveal cards
      mm.add("(min-width: 768px)", () => {
        const cards = gsap.utils.toArray(".feature-card-wrapper");
        
        // Hide cards initially for the timeline
        gsap.set(cards, { opacity: 0, y: 50, scale: 0.95 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 20px", // Pin with a slight 20px breathing room from the top
            end: "+=1200", // Pin for 1200px of scrolling
            pin: true,
            scrub: 1, // Smooth scrolling
          }
        });

        // Reveal cards one by one rhythmically
        tl.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          stagger: 0.4,
          ease: "power2.out",
        });
      });

      // Mobile: Standard individual scroll triggers (no pinning to prevent cutoff)
      mm.add("(max-width: 767px)", () => {
        gsap.utils.toArray(".feature-card-wrapper").forEach((item: any) => {
          const card = item.querySelector(".feature-card");
          if (card) {
            gsap.fromTo(
              card,
              {
                opacity: 0,
                y: 50,
                scale: 0.95,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: item,
                  start: "top 100%", 
                  end: "top 85%",   
                  scrub: 1,         
                },
              }
            );
          }
        });
      });
    }, containerRef);

    /**
     * GSAP layout shift fix — debounced. The previous version called
     * `ScrollTrigger.refresh()` on EVERY observed change to <body>, which on
     * a busy page (image load, font swap, lazy chunk) triggers a forced
     * synchronous reflow each time and was the primary contributor to
     * Lighthouse's "Forced reflow" insight.
     */
    let pending = 0;
    const refresh = () => {
      window.cancelAnimationFrame(pending);
      pending = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };
    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(document.body);

    return () => {
      window.cancelAnimationFrame(pending);
      resizeObserver.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <div className="w-full">
      <section
        ref={containerRef}
        className='bg-[#FAF9F6] relative overflow-hidden py-10 md:py-16'
      >
        <div className='max-w-7xl mx-auto px-2 sm:px-2 lg:px-4'>
        
        {/* Full-width Centered Header */}
        <div className='text-center w-full'>
          <p className='text-rose-500 font-bold uppercase tracking-widest text-sm lg:text-base mb-1 lg:mb-2'>
            The House of Rani Promise
          </p>
          <h2 className='text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900'>
            Why Shop With Us
          </h2>
          <div className='mt-5 lg:mt-6 w-20 lg:w-28 h-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-full mx-auto' />
        </div>

        <div className='flex flex-col md:flex-row gap-6 lg:gap-10 items-start'>
          
          {/* Left Side: Sticky Image (30% width) */}
          <div className='w-full md:w-4/12 lg:w-4/12 md:sticky md:top-16 flex flex-col items-center z-10'>
            {/* Standing Girl Image - Normal margin, scaled for 30% width */}
            <div className='relative w-full max-w-[280px] sm:max-w-[380px] md:max-w-[440px] aspect-[3/4] mx-auto'>
              <Image
                src={whyChooseUsImg}
                alt='House of Rani model wearing a handwoven silk saree'
                fill
                sizes='(max-width: 768px) 280px, 33vw'
                className='object-contain object-top transition-transform duration-1000 hover:scale-105 drop-shadow-2xl'
                loading='lazy'
                quality={75}
              />
            </div>
          </div>

          {/* Right Side: Scrolling Cards Grid (70% width) */}
          <div className='w-full md:w-8/12 lg:w-8/12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mt-4 lg:mt-12'>
            {features.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className='feature-card-wrapper w-full will-change-transform'>
                <div className='feature-card group relative w-full h-full rounded-2xl bg-white/80 backdrop-blur-xl p-4 md:p-5 shadow-[0_4px_15px_rgb(0,0,0,0.03)] border border-white hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left flex flex-row items-center gap-3 md:gap-4'>
                  
                  {/* Premium Background Watermark Icon */}
                  <div className='absolute -right-4 -bottom-4 opacity-[0.02] text-gray-900 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out'>
                    <Icon className='w-24 h-24' />
                  </div>

                  {/* Icon Container */}
                  <div className='relative flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-red-50 to-white flex items-center justify-center shadow-sm border border-red-100 z-10'>
                    <Icon className='h-5 w-5 md:h-6 md:w-6 text-red-600' />
                  </div>
                  
                  {/* Text Content */}
                  <div className='z-10 relative flex flex-col flex-1'>
                    <h3 className='text-sm sm:text-base md:text-lg font-serif font-bold text-gray-900 mb-0.5 md:mb-1'>
                      {title}
                    </h3>
                    <p className='text-gray-600 leading-snug text-xs md:text-sm line-clamp-2 md:line-clamp-3'>
                      {description}
                    </p>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
        </div>
      </section>
    </div>
  );
}
