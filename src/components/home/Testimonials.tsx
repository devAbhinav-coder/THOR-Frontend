 'use client';

import { useEffect, useMemo, useState } from 'react';
import StarRating from '@/components/ui/StarRating';
import { reviewApi } from '@/lib/api';
import { Review } from '@/types';

const CHUNK_SIZE = 3;
const ROTATE_INTERVAL_MS = 5000;

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [startIndex, setStartIndex] = useState(0);

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
        typeof r.comment === 'string' &&
        !!r.user &&
        typeof r.user === 'object' &&
        typeof r.user.name === 'string' &&
        r.user.name.trim().length > 0
    );
    if (safe.length <= CHUNK_SIZE) return safe;
    return Array.from({ length: CHUNK_SIZE }, (_, idx) => safe[(startIndex + idx) % safe.length]);
  }, [reviews, startIndex]);

  if (visibleReviews.length === 0) return null;

  return (
    <section className="py-20 bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-brand-400 font-medium uppercase tracking-widest text-xs mb-3">Customer Love</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            What Our Customers Say
          </h2>
          <div className="mt-4 mx-auto w-16 h-0.5 bg-brand-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleReviews.map((review) => {
            const productName =
              typeof review.product === 'string'
                ? 'Our Collection'
                : (review.product?.name || 'Our Collection');
            const reviewerName = review.user?.name || 'Customer';
            return (
            <div
              key={review._id}
              className="bg-navy-900 rounded-2xl p-7 border border-navy-700 hover:border-brand-800 transition-colors"
            >
              <StarRating rating={review.rating} size="sm" className="mb-4" />
              <p className="text-white/60 text-sm leading-relaxed mb-5 italic">&ldquo;{review.comment}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-navy-700">
                <div className="h-10 w-10 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {reviewerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{reviewerName}</p>
                  <p className="text-xs text-white/40">{productName}</p>
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
