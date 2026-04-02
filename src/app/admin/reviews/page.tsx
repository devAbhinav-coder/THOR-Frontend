'use client';

import { useState, useEffect } from 'react';
import { Trash2, Star, MessageSquare, Send, ChevronDown, ChevronUp, Check } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Review } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await adminApi.deleteReview(id);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
    setIsReplying(true);
    try {
      const res = await adminApi.replyToReview(reviewId, replyText.trim());
      const updated: Review = res.data.review;
      setReviews((prev) => prev.map((r) => r._id === reviewId ? { ...r, adminReply: updated.adminReply } : r));
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted!');
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 xl:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination.total} total reviews · Reply to customers directly</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Star className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6">
                {typeof review.product !== 'string' && (
                  <div className="mb-4">
                    {review.product.slug ? (
                      <Link
                        href={`/shop/${encodeURIComponent(review.product.slug)}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                      >
                        <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Product</span>
                        <span className="text-sm font-semibold text-gray-900">{review.product.name}</span>
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5">
                        <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Product</span>
                        <span className="text-sm font-semibold text-gray-900">{review.product.name}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Reviewer header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-600 to-navy-700 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white font-bold text-sm">{review.user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.user.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={cn('h-3.5 w-3.5', i < review.rating ? 'text-gold-400 fill-gold-400' : 'text-gray-200 fill-gray-200')} />
                          ))}
                        </div>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> Verified
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openReplyBox(review._id, review.adminReply?.text)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        review.adminReply?.text
                          ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                          : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {review.adminReply?.text ? 'Edit Reply' : 'Reply'}
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Review content */}
                {review.title && <p className="text-sm font-semibold text-gray-900 mb-1">{review.title}</p>}
                <p className={cn('text-sm text-gray-600 leading-relaxed', !expandedReplies.has(review._id) && 'line-clamp-3')}>
                  {review.comment}
                </p>
                {review.comment.length > 150 && (
                  <button onClick={() => toggleExpand(review._id)} className="mt-1 text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5 font-medium">
                    {expandedReplies.has(review._id) ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
                  </button>
                )}

                {/* Review images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {review.images.map((img, i) => (
                      <div key={i} className="relative h-14 w-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                        <Image src={img.url} alt={`Review image ${i + 1}`} fill className="object-cover" sizes="56px" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing admin reply display */}
                {review.adminReply?.text && replyingTo !== review._id && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-brand-200 bg-brand-50/50 rounded-r-xl py-3 pr-3">
                    <p className="text-xs font-bold text-brand-700 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Your reply · {formatDate(review.adminReply.createdAt)}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.adminReply.text}</p>
                  </div>
                )}

                {/* Reply input box */}
                {replyingTo === review._id && (
                  <div className="mt-4 space-y-3 animate-fadeIn">
                    <div className="relative">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Write a helpful reply to this customer…"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 placeholder-gray-400 resize-none transition-all"
                      />
                      <p className="text-xs text-gray-400 text-right mt-0.5">{replyText.length}/500</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(review._id)}
                        disabled={isReplying || !replyText.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
                      >
                        {isReplying ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Send className="h-4 w-4" />}
                        {isReplying ? 'Posting…' : 'Post Reply'}
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchReviews(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 px-2">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchReviews(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
