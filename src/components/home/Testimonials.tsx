"use client";

import { useEffect, useMemo, useState } from "react";
import { reviewApi } from "@/lib/api";
import { Review } from "@/types";
import { cn } from "@/lib/utils";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

const ROTATE_INTERVAL_MS = 6000;

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const safeReviews = useMemo(
    () =>
      reviews.filter(
        (r) =>
          !!r &&
          typeof r.comment === "string" &&
          r.comment.trim().length > 0 &&
          !!r.user &&
          typeof r.user.name === "string" &&
          r.user.name.trim().length > 0,
      ),
    [reviews],
  );

  useEffect(() => {
    if (safeReviews.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeReviews.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [safeReviews.length]);

  if (safeReviews.length === 0) return null;

  const review = safeReviews[activeIndex];
  const reviewerName = review.user?.name?.trim() || "Customer";
  const attribution = reviewerName.toUpperCase();

  return (
    <section
      className={cn(homeSectionStyles.pageBg, "py-16 sm:py-24 lg:py-28")}
      aria-label="Customer testimonials"
    >
      <div className={cn(homeSectionStyles.container, "max-w-3xl text-center")}>
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#c5a059] sm:text-xs">
          Voices of Grace
        </p>

        <div className="mt-6 text-[#c5a059]/80" aria-hidden>
          <span className="font-serif text-5xl leading-none sm:text-6xl">
            &ldquo;
          </span>
        </div>

        <blockquote className="mt-2 font-serif text-xl font-medium italic leading-relaxed text-navy-900 sm:text-2xl lg:text-[1.75rem] lg:leading-[1.5]">
          {review.comment}
        </blockquote>

        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 sm:text-xs">
          — {attribution}
        </p>

        {safeReviews.length > 1 && (
          <div
            className="mt-8 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Testimonial slides"
          >
            {safeReviews.map((r, i) => (
              <button
                key={r._id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Show testimonial ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === activeIndex ?
                    "bg-navy-900"
                  : "bg-gray-300 hover:bg-gray-400",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
