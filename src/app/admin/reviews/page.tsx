'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { Review } from '@/types';
import { cn, formatDate } from '@/lib/utils';

function ReviewStars({ rating, size = 'h-3.5 w-3.5' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(size, i < rating ? 'fill-gold-400 text-gold-400' : 'fill-gray-200 text-gray-200')}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  type ReviewFilter = 'all' | 'replied' | 'unreplied' | 'verified';
  type ReviewSort = 'newest' | 'lowest' | 'highest';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('all');
  const [sortBy, setSortBy] = useState<ReviewSort>('newest');
  const [imagePreview, setImagePreview] = useState<{
    images: { url: string }[];
    index: number;
    userName: string;
  } | null>(null);

  const fetchReviews = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getReviews({ page, limit: 20 });
      setReviews(res.data.reviews);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const metrics = useMemo(() => {
    if (!reviews.length) return { avg: 0, replied: 0, verified: 0 };
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const replied = reviews.filter((r) => !!r.adminReply?.text).length;
    const verified = reviews.filter((r) => r.isVerifiedPurchase).length;
    return {
      avg: totalRating / reviews.length,
      replied,
      verified,
    };
  }, [reviews]);

  const filterCounts = useMemo(
    () => ({
      all: reviews.length,
      replied: reviews.filter((r) => !!r.adminReply?.text).length,
      unreplied: reviews.filter((r) => !r.adminReply?.text).length,
      verified: reviews.filter((r) => r.isVerifiedPurchase).length,
    }),
    [reviews],
  );

  const visibleReviews = useMemo(() => {
    let list = [...reviews];
    if (activeFilter === 'replied') list = list.filter((r) => !!r.adminReply?.text);
    if (activeFilter === 'unreplied') list = list.filter((r) => !r.adminReply?.text);
    if (activeFilter === 'verified') list = list.filter((r) => r.isVerifiedPurchase);

    if (sortBy === 'newest') {
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
    } else {
      list.sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [reviews, activeFilter, sortBy]);

  useEffect(() => {
    if (!imagePreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImagePreview(null);
      if (e.key === 'ArrowLeft') {
        setImagePreview((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index - 1 + prev.images.length) % prev.images.length,
              }
            : prev,
        );
      }
      if (e.key === 'ArrowRight') {
        setImagePreview((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index + 1) % prev.images.length,
              }
            : prev,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imagePreview]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await adminApi.deleteReview(id);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    setIsReplying(true);
    try {
      const res = await adminApi.replyToReview(reviewId, replyText.trim());
      const updated: Review = res.data.review;
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, adminReply: updated.adminReply } : r,
        ),
      );
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted');
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setIsReplying(false);
    }
  };

  const openReplyBox = (reviewId: string, existingText?: string) => {
    setReplyingTo(reviewId);
    setReplyText(existingText || '');
  };

  const toggleExpand = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6 xl:p-8">
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-rose-50/30 to-brand-50/40 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] sm:p-7">
        <h1 className="text-2xl font-serif font-bold text-gray-900 sm:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-gray-600">
          Moderate customer feedback, maintain trust, and reply with clarity.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total reviews</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{pagination.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Average rating</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xl font-bold text-gray-900">{metrics.avg.toFixed(1)}</p>
              <ReviewStars rating={Math.round(metrics.avg)} size="h-4 w-4" />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Replied / verified</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {metrics.replied} <span className="text-sm font-medium text-gray-500">/ {metrics.verified}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'replied', label: 'Replied' },
              { id: 'unreplied', label: 'Unreplied' },
              { id: 'verified', label: 'Verified' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                activeFilter === chip.id
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              {chip.label}
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 ring-1 ring-gray-200">
                {filterCounts[chip.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="reviews-sort" className="text-xs font-semibold text-gray-500">
            Sort
          </label>
          <select
            id="reviews-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ReviewSort)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          >
            <option value="newest">Newest</option>
            <option value="lowest">Lowest rating</option>
            <option value="highest">Highest rating</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-gray-100" />
                  <div className="h-3 w-1/3 rounded bg-gray-100" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center shadow-sm">
            <Star className="mx-auto mb-4 h-12 w-12 text-gray-200" />
            <p className="text-lg font-semibold text-gray-700">No reviews yet</p>
            <p className="mt-1 text-sm text-gray-500">New customer feedback will appear here.</p>
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-base font-semibold text-gray-700">No reviews match this filter</p>
            <p className="mt-1 text-sm text-gray-500">Try another filter or sort option.</p>
          </div>
        ) : (
          visibleReviews.map((review) => {
            const userName = review.user?.name || 'Unknown user';
            const avatarUrl = review.user?.avatar?.trim();
            const initials = userName.charAt(0).toUpperCase();
            const isExpanded = expandedReplies.has(review._id);

            return (
              <div
                key={review._id}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_16px_50px_-34px_rgba(2,6,23,0.45)]"
              >
                <div className="p-5 sm:p-6">
                  {typeof review.product !== 'string' && (
                    <div className="mb-4">
                      {review.product.slug ? (
                        <Link
                          href={`/shop/${encodeURIComponent(review.product.slug)}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/70 px-3 py-1.5 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                        >
                          <span className="text-[11px] uppercase tracking-wide text-brand-700/80">Product</span>
                          <span>{review.product.name}</span>
                        </Link>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800">
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">Product</span>
                          <span>{review.product.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100">
                        {avatarUrl ? (
                          // Using native img avoids next/image remote-host restrictions for arbitrary user avatars.
                          <img
                            src={avatarUrl}
                            alt={`${userName} avatar`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600 to-navy-700 text-sm font-bold text-white">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <ReviewStars rating={review.rating} />
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <Check className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => openReplyBox(review._id, review.adminReply?.text)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                          review.adminReply?.text
                            ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                            : 'bg-navy-50 text-navy-700 hover:bg-navy-100',
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {review.adminReply?.text ? 'Edit reply' : 'Reply'}
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {review.title && (
                    <p className="mb-1 text-sm font-semibold text-gray-900">{review.title}</p>
                  )}
                  <p
                    className={cn(
                      'text-sm leading-relaxed text-gray-600',
                      !isExpanded && 'line-clamp-3',
                    )}
                  >
                    {review.comment}
                  </p>
                  {review.comment.length > 150 && (
                    <button
                      onClick={() => toggleExpand(review._id)}
                      className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Show more
                        </>
                      )}
                    </button>
                  )}

                  {review.images && review.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setImagePreview({
                              images: review.images ?? [],
                              index: i,
                              userName,
                            })
                          }
                          className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                        >
                          <Image
                            src={img.url}
                            alt={`Review image ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {review.adminReply?.text && replyingTo !== review._id && (
                    <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-3.5">
                      <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Your reply · {formatDate(review.adminReply.createdAt)}
                      </p>
                      <p className="text-sm leading-relaxed text-gray-700">{review.adminReply.text}</p>
                    </div>
                  )}

                  {replyingTo === review._id && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5">
                      <div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="Write a helpful reply to this customer..."
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <p className="mt-0.5 text-right text-xs text-gray-400">{replyText.length}/500</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleReply(review._id)}
                          disabled={isReplying || !replyText.trim()}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                        >
                          {isReplying ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {isReplying ? 'Posting...' : 'Post reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchReviews(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchReviews(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {imagePreview && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl border border-white/20 bg-black/70 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Close image preview"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative h-[min(72vh,640px)] w-full overflow-hidden rounded-xl bg-black/40">
              <Image
                src={imagePreview.images[imagePreview.index]!.url}
                alt={`Review image ${imagePreview.index + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            {imagePreview.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setImagePreview((prev) =>
                      prev
                        ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
                        : prev,
                    )
                  }
                  className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImagePreview((prev) =>
                      prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : prev,
                    )
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/70"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="mt-2 flex items-center justify-between px-1 text-xs text-white/85">
              <span>{imagePreview.userName}</span>
              <span>
                {imagePreview.index + 1} / {imagePreview.images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
