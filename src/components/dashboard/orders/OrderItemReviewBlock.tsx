"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Check, Sparkles, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const REVIEW_TITLE_OPTIONS = [
  { value: "Not satisfied", label: "😕 Not satisfied" },
  { value: "Could be better", label: "🙂 Could be better" },
  { value: "Good overall", label: "👍 Good overall" },
  { value: "Very good", label: "✨ Very good" },
  { value: "Loved it", label: "😍 Loved it" },
  { value: "Excellent purchase", label: "🌟 Excellent purchase" },
] as const;

export const RATING_MESSAGES: Record<number, { emoji: string; msg: string; sub: string }> = {
  1: { emoji: "😔", msg: "We're sorry to hear that", sub: "Your feedback helps us improve." },
  2: { emoji: "🤔", msg: "Thanks for being honest", sub: "We appreciate your honesty." },
  3: { emoji: "🙏", msg: "Thank you for your feedback!", sub: "We value your experience." },
  4: { emoji: "😊", msg: "Glad you liked it!", sub: "Your kind words mean a lot." },
  5: { emoji: "🌟", msg: "You loved it!", sub: "Your review helps other patrons discover our pieces." },
};

export function isPresetReviewTitle(title: string) {
  return REVIEW_TITLE_OPTIONS.some((o) => o.value === title);
}

export function titleForRating(rating: number): string {
  if (rating <= 2) return "Not satisfied";
  if (rating === 3) return "Good overall";
  if (rating === 4) return "Very good";
  return "Loved it";
}

export function InlineStars({
  canReview,
  alreadyReviewed,
  submittedRating,
  selectedRating,
  onOpen,
}: {
  canReview: boolean;
  alreadyReviewed: boolean;
  submittedRating: number;
  selectedRating: number;
  onOpen: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  if (alreadyReviewed) {
    const info = RATING_MESSAGES[submittedRating] || RATING_MESSAGES[5];
    return (
      <div className="mt-4 bg-account-surface-container border border-account-outline-variant/30 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "h-4 w-4",
                  n <= submittedRating ? "fill-account-secondary text-account-secondary" : "fill-account-outline-variant text-account-outline-variant",
                )}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-account-secondary flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Review submitted
          </span>
        </div>
        <p className="text-sm font-medium text-account-primary">{info.emoji} {info.msg}</p>
      </div>
    );
  }

  if (!canReview) return null;

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-account-on-surface-variant">
        Rate this piece
      </p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onOpen(n)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${n} stars`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                (hovered || selectedRating) >= n ?
                  "fill-account-secondary text-account-secondary"
                : "fill-account-outline-variant/50 text-account-outline-variant",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

type ReviewFormProps = {
  productId: string;
  formData: { rating: number; title: string; comment: string };
  previews: string[];
  submitting: boolean;
  msgHeading: string;
  msgSub: string;
  onUpdate: (field: "rating" | "title" | "comment", value: string | number) => void;
  onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export function OrderReviewForm({
  productId,
  formData,
  previews,
  submitting,
  msgHeading,
  msgSub,
  onUpdate,
  onImagesChange,
  onRemoveImage,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  return (
    <div
      id={`review-form-${productId}`}
      className="mt-6 bg-account-surface-container border border-account-outline-variant/30 p-6"
    >
      <div className="flex items-start gap-3 mb-6">
        <Sparkles className="h-5 w-5 text-account-secondary shrink-0 mt-0.5" />
        <div>
          <p className="font-serif text-lg text-account-primary">{msgHeading}</p>
          <p className="text-sm text-account-on-surface-variant mt-1">{msgSub}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-account-on-surface-variant mb-2">
            Your rating *
          </p>
          <div className="flex gap-1 items-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => onUpdate("rating", n)}>
                <Star
                  className={cn(
                    "h-7 w-7",
                    formData.rating >= n ?
                      "fill-account-secondary text-account-secondary"
                    : "fill-account-outline-variant/50 text-account-outline-variant",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-account-on-surface-variant mb-2">
            Headline (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TITLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate("title", opt.value)}
                className={cn(
                  "text-xs px-3 py-1.5 border transition-colors",
                  formData.title === opt.value ?
                    "border-account-primary bg-account-primary text-white"
                  : "border-account-outline-variant/50 text-account-on-surface-variant hover:border-account-secondary",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-account-on-surface-variant mb-2">
            Your review *
          </p>
          <textarea
            value={formData.comment}
            onChange={(e) => onUpdate("comment", e.target.value)}
            maxLength={1000}
            rows={4}
            required
            placeholder="Share your experience with the craftsmanship, fit, and finish…"
            className="w-full bg-transparent border border-account-outline-variant/50 p-3 text-sm text-account-primary focus:outline-none focus:border-account-secondary resize-none"
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-account-on-surface-variant mb-2">
            Photos (up to 3)
          </p>
          <div className="flex flex-wrap gap-2">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative h-16 w-16 overflow-hidden border border-account-outline-variant/30">
                <Image src={preview} alt="" fill sizes="64px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute top-0 right-0 h-5 w-5 bg-account-primary text-white flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {previews.length < 3 && (
              <label className="h-16 w-16 border border-dashed border-account-outline-variant flex items-center justify-center cursor-pointer hover:border-account-secondary">
                <Plus className="h-4 w-4 text-account-outline" />
                <input type="file" accept="image/*" multiple onChange={onImagesChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-account-primary text-white px-8 py-3 text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-account-outline-variant text-account-primary px-8 py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-account-surface-container"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
