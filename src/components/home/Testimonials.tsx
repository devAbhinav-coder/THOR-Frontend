"use client";

import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import StarRating from "@/components/ui/StarRating";
import { reviewApi } from "@/lib/api";
import { Review } from "@/types";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CHUNK_SIZE = 3;
const ROTATE_INTERVAL_MS = 5000;

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await reviewApi.getFeatured();
        setReviews(res.data.reviews || []);
      } catch {
        setReviews([]);
      }
    };
    loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length <= CHUNK_SIZE) return;
    const timer = window.setInterval(() => {
      setStartIndex((prev) => (prev + CHUNK_SIZE) % reviews.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reviews.length]);

  const visibleReviews = useMemo(() => {
    const safe = reviews.filter(
      (r) =>
        !!r &&
        typeof r.comment === "string" &&
        !!r.user &&
        typeof r.user === "object" &&
        typeof r.user.name === "string" &&
        r.user.name.trim().length > 0
    );
    if (safe.length <= CHUNK_SIZE) return safe;
    return Array.from(
      { length: CHUNK_SIZE },
      (_, idx) => safe[(startIndex + idx) % safe.length]
    );
  }, [reviews, startIndex]);

  // Handle entry animation when section scrolls into view
  useLayoutEffect(() => {
    if (visibleReviews.length === 0) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".testimonial-wrapper",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [visibleReviews.length]);

  if (visibleReviews.length === 0) return null;

  return (
    <section ref={sectionRef} className='py-24 bg-[#FAF9F6] relative overflow-hidden'>
      {/* Background Decor */}
      <div className='pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px]' />
      <div className='pointer-events-none absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px]   bg-rose-200/30 rounded-full blur-[120px]' />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='text-center mb-16'>
          <p className='text-rose-500 font-bold uppercase tracking-widest text-sm mb-3'>
             <del>Customers</del> Family Love
          </p>
          {/* cut in customer and family */}
          <h2 className='text-4xl sm:text-5xl font-serif font-bold text-gray-900'>
            Real Stories, Real Smiles
          </h2>
          <div className='mt-6 mx-auto w-20 h-1 bg-gradient-to-r from-rose-400 to-amber-300 rounded-full' />
        </div>

        <div ref={containerRef} className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {visibleReviews.map((review, i) => {
            const productName =
              typeof review.product === "string"
                ? "Our Collection"
                : review.product?.name || "Our Collection";
            const reviewerName = review.user?.name || "Customer";
            return (
              <div key={`wrapper-${i}`} className='testimonial-wrapper opacity-0 will-change-transform'>
                <div
                  key={`${review._id}-${startIndex}`}
                  className='testimonial-card bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-in fade-in zoom-in duration-500'
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <StarRating rating={review.rating} size='sm' className='mb-6' />
                  <p className='text-gray-600 text-base leading-relaxed mb-8 flex-grow font-medium'>
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <div className='flex items-center gap-4 pt-6 border-t border-gray-100/80'>
                    {review.user?.avatar ?
                      <div className='relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0'>
                        <Image
                          src={review.user.avatar}
                          alt={reviewerName}
                          fill
                          sizes='48px'
                          className='object-cover'
                        />
                      </div>
                    : <div className='h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-rose-200'>
                        <span className='text-rose-600 font-bold text-lg'>
                          {reviewerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    }
                    <div>
                      <p className='font-bold text-gray-900'>{reviewerName}</p>
                      <p className='text-sm text-gray-500 line-clamp-1'>
                        {productName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
