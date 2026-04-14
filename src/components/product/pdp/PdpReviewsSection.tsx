"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Star,
  MessageSquare,
  Check,
  ChevronRight,
  ThumbsUp,
  Flag,
  Package,
  Plus,
  X,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { Product, Review } from "@/types";
import { StarSelector, RatingBar } from "./PdpReviewPrimitives";
import type { ReviewEligibility, ReviewFormState } from "./types";

const REVIEW_TITLE_OPTIONS = [
  { value: "Not satisfied", label: "😕 Not satisfied" },
  { value: "Could be better", label: "🙂 Could be better" },
  { value: "Good overall", label: "👍 Good overall" },
  { value: "Very good", label: "✨ Very good" },
  { value: "Loved it", label: "😍 Loved it" },
  { value: "Excellent purchase", label: "🌟 Excellent purchase" },
] as const;
const isPresetReviewTitle = (title: string) =>
  REVIEW_TITLE_OPTIONS.some((o) => o.value === title);

function titleForRating(rating: number): string {
  if (rating <= 2) return "Not satisfied";
  if (rating === 3) return "Good overall";
  if (rating === 4) return "Very good";
  return "Loved it";
}

export interface PdpReviewsSectionProps {
  product: Product;
  isAuthenticated: boolean;
  totalReviews: number;
  previewReviewCount: number;
  visibleReviews: Review[];
  reviews: Review[];
  ratingDistribution: { _id: number | string; count: number }[];
  positiveReviewsPercent: number;
  reviewEligibility: ReviewEligibility | null;
  showReviewForm: boolean;
  setShowReviewForm: React.Dispatch<React.SetStateAction<boolean>>;
  reviewForm: ReviewFormState;
  setReviewForm: React.Dispatch<React.SetStateAction<ReviewFormState>>;
  reviewImages: File[];
  reviewPreviews: string[];
  onReviewImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReviewImage: (index: number) => void;
  isSubmittingReview: boolean;
  onSubmitReview: (e: React.FormEvent) => void;
  expandedReviewPhotos: Record<string, boolean>;
  setExpandedReviewPhotos: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  reviewLightbox: { images: string[]; index: number } | null;
  setReviewLightbox: React.Dispatch<
    React.SetStateAction<{ images: string[]; index: number } | null>
  >;
  showAllReviewsModal: boolean;
  setShowAllReviewsModal: React.Dispatch<React.SetStateAction<boolean>>;
  isVotingHelpful: Record<string, boolean>;
  onHelpfulVote: (reviewId: string) => void;
  onOpenReportReview: (review: Review) => void;
  reportTarget: Review | null;
  setReportTarget: React.Dispatch<React.SetStateAction<Review | null>>;
  reportingReviewId: string | null;
  reportReason: "spam" | "abusive" | "misleading" | "other";
  setReportReason: React.Dispatch<
    React.SetStateAction<"spam" | "abusive" | "misleading" | "other">
  >;
  reportDetails: string;
  setReportDetails: React.Dispatch<React.SetStateAction<string>>;
  onSubmitReport: (e: React.FormEvent) => void;
}

export function PdpReviewsSection({
  product,
  isAuthenticated,
  totalReviews,
  previewReviewCount,
  visibleReviews,
  reviews,
  ratingDistribution,
  positiveReviewsPercent,
  reviewEligibility,
  showReviewForm,
  setShowReviewForm,
  reviewForm,
  setReviewForm,
  reviewImages,
  reviewPreviews,
  onReviewImageChange,
  onRemoveReviewImage,
  isSubmittingReview,
  onSubmitReview,
  expandedReviewPhotos,
  setExpandedReviewPhotos,
  reviewLightbox,
  setReviewLightbox,
  showAllReviewsModal,
  setShowAllReviewsModal,
  isVotingHelpful,
  onHelpfulVote,
  onOpenReportReview,
  reportTarget,
  setReportTarget,
  reportingReviewId,
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails,
  onSubmitReport,
}: PdpReviewsSectionProps) {
  const displayAverageRating = useMemo(() => {
    const fromProduct = Number(product.ratings?.average || 0);
    if (fromProduct > 0) return fromProduct;
    if (reviews.length === 0) return 0;
    return Number(
      (
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      ).toFixed(1),
    );
  }, [product.ratings?.average, reviews]);

  return (
    <>
      <section id='reviews-section' className='py-8 sm:py-12 bg-[#faf9f7]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-10'>
            <div>
              <p className='text-[11px] font-bold text-brand-600 uppercase tracking-[0.2em] mb-2'>
                Customer Experience
              </p>
              <h2 className='text-2xl sm:text-4xl font-serif font-black text-navy-900 flex items-center gap-2 sm:gap-3'>
                Ratings & Reviews
                {totalReviews > 0 && (
                  <span className='inline-flex items-center justify-center bg-navy-50 text-navy-600 text-sm font-bold h-7 px-2.5 rounded-lg border border-navy-100'>
                    {totalReviews}
                  </span>
                )}
              </h2>
            </div>

            {isAuthenticated ?
              reviewEligibility?.canReview ?
                <button
                  type='button'
                  onClick={() => setShowReviewForm((v) => !v)}
                  className='flex items-center gap-2.5 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-navy-100 active:scale-95'
                >
                  <MessageSquare className='h-4.5 w-4.5' />
                  Share Your Story
                </button>
              : reviewEligibility?.hasReviewed ?
                <span className='text-sm text-green-600 font-bold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100'>
                  <Check className='h-4 w-4' /> Review Submitted
                </span>
              : null
            : <Link
                href='/auth/login'
                className='text-sm text-brand-600 font-bold hover:bg-brand-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2'
              >
                Sign in to review <ChevronRight className='h-4 w-4' />
              </Link>
            }
          </div>

          {showReviewForm && reviewEligibility?.canReview && (
            <div className='bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-4 sm:p-10 mb-8 sm:mb-12 animate-fadeIn ring-1 ring-black/5'>
              <div className='max-w-3xl mx-auto'>
                <h3 className='font-serif text-2xl font-bold text-navy-900 mb-2'>
                  How was your product?
                </h3>
                <p className='text-sm text-gray-500 mb-8'>
                  Your feedback helps thousands of House of Rani shoppers.
                </p>

                <form
                  onSubmit={onSubmitReview}
                  className='space-y-5 sm:space-y-8'
                >
                  <div className='bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100'>
                    <label className='block text-[11px] font-bold text-navy-900 uppercase tracking-widest mb-4'>
                      Select Rating
                    </label>
                    <StarSelector
                      value={reviewForm.rating}
                      onChange={(v) =>
                        setReviewForm((f) => {
                          const next = titleForRating(v);
                          const shouldAutoTitle =
                            !f.title || isPresetReviewTitle(f.title);
                          return { ...f, rating: v, title: shouldAutoTitle ? next : f.title };
                        })
                      }
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-6'>
                    <div className='space-y-2'>
                      <label className='block text-xs font-bold text-gray-700 uppercase tracking-tight'>
                        Review Title
                      </label>
                      <div className='rounded-2xl border border-gray-200 bg-white p-3'>
                        <div className='flex flex-wrap gap-2'>
                          <button
                            type='button'
                            onClick={() =>
                              setReviewForm((f) => ({
                                ...f,
                                title: "",
                              }))
                            }
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                              !reviewForm.title ?
                                "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                            )}
                          >
                            Skip
                          </button>
                          {REVIEW_TITLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type='button'
                              onClick={() =>
                                setReviewForm((f) => ({
                                  ...f,
                                  title: opt.value,
                                }))
                              }
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                reviewForm.title === opt.value ?
                                  "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                                : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50/40",
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className='text-[11px] text-gray-500'>
                        Pick a quick headline so other shoppers can scan reviews easily.
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <label className='block text-xs font-bold text-gray-700 uppercase tracking-tight'>
                        Your Feedback *
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((f) => ({
                            ...f,
                            comment: e.target.value,
                          }))
                        }
                        maxLength={1000}
                        rows={5}
                        required
                        placeholder='Detail your thoughts on fabric, fit, and style...'
                        className='w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-400 placeholder-gray-400 resize-none transition-all bg-white'
                      />
                      <div className='flex justify-end'>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            reviewForm.comment.length > 950 ?
                              "bg-red-50 text-red-500"
                            : "bg-gray-100 text-gray-400",
                          )}
                        >
                          {reviewForm.comment.length} / 1000
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <label className='block text-xs font-bold text-gray-700 uppercase tracking-tight'>
                      Attach Photos (Up to 3)
                    </label>
                    <div className='flex flex-wrap gap-4'>
                      {reviewPreviews.map((preview, i) => (
                        <div
                          key={i}
                          className='relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-brand-100 ring-4 ring-brand-50/30 group'
                        >
                          <Image
                            src={preview}
                            alt='Preview'
                            fill
                            className='object-cover'
                          />
                          <button
                            type='button'
                            onClick={() => onRemoveReviewImage(i)}
                            className='absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-90'
                          >
                            <Plus className='h-4 w-4 rotate-45' />
                          </button>
                        </div>
                      ))}

                      {reviewImages.length < 3 && (
                        <label className='h-24 w-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-brand-300 transition-all flex flex-col items-center justify-center cursor-pointer group active:scale-95'>
                          <Plus className='h-6 w-6 text-gray-400 group-hover:text-brand-600 transition-colors' />
                          <span className='text-[10px] font-bold text-gray-400 group-hover:text-brand-600 mt-1 uppercase'>
                            Add Photo
                          </span>
                          <input
                            type='file'
                            accept='image/*'
                            multiple
                            onChange={onReviewImageChange}
                            className='hidden'
                          />
                        </label>
                      )}
                    </div>
                    <p className='text-[10px] text-gray-400 italic'>
                      Images help other shoppers see the product in real life (max 3 photos, 8MB each).
                    </p>
                  </div>

                  <div className='flex items-center gap-4 pt-4 border-t border-gray-50'>
                    <button
                      type='submit'
                      disabled={isSubmittingReview}
                      className='flex-1 sm:flex-none sm:px-12 py-4 bg-navy-900 hover:bg-black text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-navy-100 disabled:opacity-60 flex items-center justify-center gap-3 active:scale-[0.98]'
                    >
                      {isSubmittingReview ?
                        <>
                          <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />{" "}
                          Publishing...
                        </>
                      : "Post My Review"}
                    </button>
                    <button
                      type='button'
                      onClick={() => setShowReviewForm(false)}
                      className='px-8 py-4 border border-gray-200 text-gray-500 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98]'
                    >
                      Wait, not now
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {reviews.length === 0 ?
            <div className='text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm'>
              <div className='inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-50 mb-6'>
                <Star className='h-8 w-8 text-gray-200' />
              </div>
              <p className='text-gray-900 font-serif text-xl font-bold'>
                No reviews yet
              </p>
              <p className='text-sm text-gray-500 mt-2 max-w-xs mx-auto'>
                Be the first to share your thoughts and help our community.
              </p>
            </div>
          : <div className='grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 sm:gap-10 xl:gap-16'>
              <div className='bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 h-fit shadow-xl shadow-gray-200/20 self-start z-10'>
                <div className='text-center mb-8 pb-8 border-b border-gray-100'>
                  <div className='flex justify-center items-center gap-3 mb-1'>
                    <p className='text-7xl font-black text-navy-900 tracking-tighter'>
                      {displayAverageRating.toFixed(1)}
                    </p>
                    <div className='text-left'>
                      <Star className='h-8 w-8 fill-gold-400 text-gold-400 mb-1' />
                      <p className='text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none'>
                        out of 5.0
                      </p>
                    </div>
                  </div>
                  <p className='text-sm font-bold text-gray-400 mt-4 tracking-tight'>
                    Verified ratings from {totalReviews} customers
                  </p>
                </div>

                <div className='space-y-4'>
                  <div className='flex justify-between items-center mb-2 px-1'>
                    <span className='text-[11px] font-black text-navy-900 uppercase tracking-wider'>
                      Rating Breakdown
                    </span>
                    <span className='text-[11px] font-black text-brand-600 uppercase tracking-wider'>
                      {positiveReviewsPercent}% Positive
                    </span>
                  </div>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const found = ratingDistribution.find(
                      (d) => Number(d._id) === star,
                    );
                    return (
                      <RatingBar
                        key={star}
                        label={String(star)}
                        count={found?.count || 0}
                        total={totalReviews}
                      />
                    );
                  })}
                </div>
              </div>

              <div className='space-y-6'>
                {visibleReviews.map((review) => (
                  <div
                    key={review._id}
                    className='bg-white rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-start justify-between mb-6 gap-4'>
                      <div className='flex items-center gap-4'>
                        <div className='h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-navy-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-100/50 rotate-3'>
                          <span className='text-white font-black text-lg'>
                            {String(review.user?.name || "Customer")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className='text-[15px] font-bold text-gray-900 tracking-tight'>
                            {review.user?.name || "Customer"}
                          </p>
                          <div className='flex items-center gap-2.5 mt-1'>
                            {review.isVerifiedPurchase && (
                              <span className='text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 ring-1 ring-green-100'>
                                <Check className='h-2.5 w-2.5' /> VERIFIED
                              </span>
                            )}
                            <span className='text-[10px] font-bold text-gray-400 tracking-widest uppercase'>
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-1 shrink-0 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100'>
                        <span className='text-xs font-black text-navy-900 mr-0.5'>
                          {review.rating}.0
                        </span>
                        <Star className='h-3.5 w-3.5 fill-gold-400 text-gold-400' />
                      </div>
                    </div>

                    <div className='relative'>
                      {review.title && (
                        <h4 className='font-bold text-gray-900 mb-2 text-lg tracking-tight font-serif italic'>
                          &ldquo;{review.title}&rdquo;
                        </h4>
                      )}
                      <p className='text-[15px] text-gray-700 leading-relaxed break-words font-medium'>
                        {review.comment}
                      </p>
                    </div>

                    {review.images && review.images.length > 0 && (
                      <div className='mt-4'>
                        <div className='flex min-w-0 max-w-full items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 scrollbar-hide touch-pan-x'>
                          {(expandedReviewPhotos[review._id] ?
                            review.images
                          : review.images.slice(0, 3)
                          ).map((img, i) => (
                            <button
                              key={i}
                              type='button'
                              onClick={() =>
                                setReviewLightbox({
                                  images: review.images!.map((x) => x.url),
                                  index: i,
                                })
                              }
                              className='relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0'
                            >
                              <Image
                                src={img.url}
                                alt='Review photo'
                                fill
                                className='object-cover'
                                sizes='80px'
                              />
                            </button>
                          ))}
                          {!expandedReviewPhotos[review._id] &&
                            review.images.length > 3 && (
                              <button
                                type='button'
                                onClick={() =>
                                  setExpandedReviewPhotos((prev) => ({
                                    ...prev,
                                    [review._id]: true,
                                  }))
                                }
                                className='h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-600 bg-white flex-shrink-0'
                              >
                                +{review.images.length - 3} more
                              </button>
                            )}
                        </div>
                        {review.images.length > 3 &&
                          expandedReviewPhotos[review._id] && (
                            <button
                              type='button'
                              onClick={() =>
                                setExpandedReviewPhotos((prev) => ({
                                  ...prev,
                                  [review._id]: false,
                                }))
                              }
                              className='mt-2 text-xs font-medium text-brand-600 hover:text-brand-700'
                            >
                              Show less
                            </button>
                          )}
                      </div>
                    )}

                    <div className='mt-8 pt-6 border-t border-gray-50 flex items-center justify-between gap-3'>
                      <button
                        type='button'
                        onClick={() => onHelpfulVote(review._id)}
                        disabled={!!isVotingHelpful[review._id]}
                        className='flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-600 transition-all hover:bg-brand-50 px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-60'
                      >
                        <ThumbsUp className='h-3.5 w-3.5' />
                        Was this helpful?{" "}
                        {review.helpfulVotes.length > 0 && (
                          <span className='ml-1 text-navy-900'>
                            ({review.helpfulVotes.length})
                          </span>
                        )}
                      </button>

                      <button
                        type='button'
                        onClick={() => onOpenReportReview(review)}
                        className='text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors inline-flex items-center gap-1'
                      >
                        <Flag className='h-3 w-3' />
                        Report Review
                      </button>
                    </div>

                    {review.adminReply?.text && (
                      <div className='mt-6 ml-4 sm:ml-8 pl-6 border-l-4 border-brand-200 bg-brand-50/20 rounded-2xl p-5 relative overflow-hidden'>
                        <div className='absolute top-0 right-0 p-2 opacity-[0.03] scale-150 grayscale'>
                          <Package className='h-12 w-12' />
                        </div>
                        <p className='text-xs font-black text-brand-700 mb-2 flex items-center gap-2 uppercase tracking-widest'>
                          <MessageSquare className='h-4 w-4' />
                          Official Response
                        </p>
                        <p className='text-sm font-medium text-gray-700 leading-relaxed italic'>
                          &ldquo;{review.adminReply.text}&rdquo;
                        </p>
                        <p className='text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest'>
                          {formatDate(review.adminReply.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {reviews.length > previewReviewCount && (
                  <button
                    type='button'
                    onClick={() => setShowAllReviewsModal(true)}
                    className='w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700'
                  >
                    View all reviews ({reviews.length})
                  </button>
                )}
              </div>
            </div>
          }
        </div>
      </section>

      {showAllReviewsModal && (
        <div className='fixed inset-0 z-[75] bg-black/60 p-4 sm:p-6'>
          <div className='mx-auto h-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden'>
            <div className='px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-500'>Customer reviews</p>
                <h3 className='text-lg font-bold text-navy-900'>
                  All reviews ({reviews.length})
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setShowAllReviewsModal(false)}
                className='h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center'
                aria-label='Close reviews'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50'>
              {reviews.map((review) => (
                <div
                  key={`all_${review._id}`}
                  className='bg-white border border-gray-100 rounded-2xl p-4 sm:p-5'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>
                        {review.user?.name || "Customer"}
                      </p>
                      <p className='text-[11px] text-gray-400'>
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <div className='text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg px-2 py-1'>
                      {review.rating}.0 ★
                    </div>
                  </div>
                  {review.title && (
                    <p className='mt-2 text-sm font-semibold text-gray-900'>
                      {review.title}
                    </p>
                  )}
                  <p className='mt-1 text-sm text-gray-700 leading-relaxed'>
                    {review.comment}
                  </p>
                  <div className='mt-3 flex justify-end'>
                    <button
                      type='button'
                      onClick={() => onOpenReportReview(review)}
                      className='text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 inline-flex items-center gap-1'
                    >
                      <Flag className='h-3 w-3' />
                      Report Review
                    </button>
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className='mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 scrollbar-hide touch-pan-x'>
                      {review.images.slice(0, 3).map((img, i) => (
                        <button
                          key={`all_img_${review._id}_${i}`}
                          type='button'
                          onClick={() =>
                            setReviewLightbox({
                              images: review.images!.map((x) => x.url),
                              index: i,
                            })
                          }
                          className='relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0'
                        >
                          <Image
                            src={img.url}
                            alt='Review image'
                            fill
                            className='object-cover'
                            sizes='64px'
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportTarget && (
        <div className='fixed inset-0 z-[78] bg-black/55 p-3 sm:p-6 flex items-end sm:items-center justify-center'>
          <div className='w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl max-h-[92vh] overflow-y-auto'>
            <div className='px-4 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-widest text-gray-500'>
                  Report review
                </p>
                <h3 className='text-lg font-bold text-navy-900'>
                  Help us keep reviews trustworthy
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setReportTarget(null)}
                className='h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center'
                aria-label='Close report form'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <form onSubmit={onSubmitReport} className='p-4 sm:p-6 space-y-4'>
              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-700 uppercase tracking-tight'>
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) =>
                    setReportReason(
                      e.target.value as
                        | "spam"
                        | "abusive"
                        | "misleading"
                        | "other",
                    )
                  }
                  className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400'
                >
                  <option value='spam'>Spam or promotion</option>
                  <option value='abusive'>Abusive language</option>
                  <option value='misleading'>Misleading content</option>
                  <option value='other'>Other</option>
                </select>
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-700 uppercase tracking-tight'>
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  maxLength={300}
                  rows={4}
                  placeholder='Tell us what is wrong with this review'
                  className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 resize-none'
                />
                <p className='text-[11px] text-gray-400 text-right'>
                  {reportDetails.length}/300
                </p>
              </div>

              <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2'>
                <button
                  type='button'
                  onClick={() => setReportTarget(null)}
                  className='px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={reportingReviewId === reportTarget._id}
                  className='px-4 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-60'
                >
                  {reportingReviewId === reportTarget._id ?
                    "Submitting..."
                  : "Submit report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewLightbox && (
        <div className='fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4'>
          <button
            type='button'
            className='absolute top-4 right-4 h-9 w-9 rounded-full bg-white/20 text-white flex items-center justify-center'
            onClick={() => setReviewLightbox(null)}
            aria-label='Close image preview'
          >
            <X className='h-5 w-5' />
          </button>
          <div className='relative w-full max-w-xl aspect-[3/4] bg-black/30 rounded-xl overflow-hidden'>
            <Image
              src={reviewLightbox.images[reviewLightbox.index]}
              alt='Review photo preview'
              fill
              className='object-contain'
              sizes='80vw'
            />
          </div>
        </div>
      )}
    </>
  );
}
