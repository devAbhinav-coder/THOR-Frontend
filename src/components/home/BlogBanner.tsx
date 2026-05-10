"use client";

import { useEffect, useState, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { storefrontApi } from "@/lib/api";
import { StorefrontSettings } from "@/types";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function BlogBanner() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const blog = settings?.blogBanner;

  useLayoutEffect(() => {
    if (!blog?.mainImage || !containerRef.current || !cardRef.current) return;

    const ctx = gsap.context(() => {
      // Fade in the entire card smoothly
      gsap.fromTo(
        cardRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // Stagger in the text content inside the card
      gsap.fromTo(
        ".blog-text-reveal",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // Add subtle parallax to the floating side image
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          yPercent: -20,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [blog?.mainImage]);

  if (!blog?.mainImage) return null;

  return (
    <section
      ref={containerRef}
      className='relative overflow-hidden bg-[#FAF9F6] py-16 sm:py-24 isolate'
    >
      {/* Decorative background gradients */}
      <div className='absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-rose-200/40 rounded-full blur-[100px] pointer-events-none' />
      <div className='absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-amber-200/30 rounded-full blur-[100px] pointer-events-none' />

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Apple-like Glass Card */}
        <div
          ref={cardRef}
          className='bg-white/80 backdrop-blur-2xl border border-white rounded-[2rem] p-6 sm:p-10 lg:p-14 overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative'
        >
          <div className='grid lg:grid-cols-2 gap-10 lg:gap-8 items-center relative z-10'>
            {/* Text Content */}
            <div className='max-w-xl mx-auto text-center lg:text-left'>
              <div className='blog-text-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6'>
                <BookOpen className='w-3.5 h-3.5' />
                {blog?.eyebrow || "Journal & Stories"}
              </div>

              <h2 className='blog-text-reveal text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 tracking-tight mb-5 leading-[1.15]'>
                {blog?.title?.split(" ").map((word, i, arr) => {
                  if (i >= arr.length - 2 && i > 0) {
                    return (
                      <span
                        key={i}
                        className='text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500'
                      >
                        {" "}
                        {word}
                      </span>
                    );
                  }
                  return i === 0 ? word : " " + word;
                }) || (
                  <>
                    Discover the{" "}
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500'>
                      Art of Ethnic
                    </span>
                  </>
                )}
              </h2>

              <p className='blog-text-reveal text-base sm:text-lg text-gray-600 mb-8 leading-relaxed font-medium px-4 lg:px-0'>
                {blog?.description ||
                  "Dive deep into the rich history of Indian textures, get styling tips from experts, and stay updated with our latest collections."}
              </p>

              <div className='blog-text-reveal flex flex-col sm:flex-row justify-center lg:justify-start gap-4'>
                <Link
                  href={blog?.buttonLink || "/blog"}
                  className='group inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-rose-600 hover:shadow-lg hover:-translate-y-0.5'
                >
                  {blog?.buttonText || "Visit Our Blog"}
                  <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                </Link>
              </div>
            </div>

            {/* Image Composition */}
            <div className='relative h-full min-h-[300px] sm:min-h-[350px] lg:min-h-full flex items-center justify-center mt-6 lg:mt-0'>
              {/* Main Image */}
              <div className='blog-text-reveal relative w-full max-w-[280px] sm:max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.1)] transform rotate-2 hover:rotate-0 transition-transform duration-700 border-4 border-white group'>
                <Image
                  src={blog?.mainImage || ""}
                  alt={
                    blog?.title || "From The House of Rani journal"
                  }
                  fill
                  loader={cloudinaryLoader}
                  sizes='(max-width: 640px) 280px, 384px'
                  loading='lazy'
                  quality={70}
                  className='object-cover transition-transform duration-700 group-hover:scale-110'
                />
              </div>

              {/* Decorative floating side element */}
              {blog?.sideImage && (
                <div
                  ref={imageRef}
                  className='absolute top-1/4 -left-4 sm:-left-8 lg:-left-12 w-32 sm:w-40 aspect-square rounded-2xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] transform -rotate-6 border-[3px] border-white z-20 hidden sm:block bg-white'
                  aria-hidden='true'
                >
                  <Image
                    src={blog.sideImage}
                    alt=''
                    fill
                    loader={cloudinaryLoader}
                    sizes='160px'
                    loading='lazy'
                    quality={65}
                    className='object-cover'
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
