"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  Zap,
  Package,
  MapPin,
  Share2,
  Check,
  MessageSquare,
  ThumbsUp,
  Flag,
  ChevronDown,
  ChevronUp,
  Gift,
  X,
} from "lucide-react";
import { cartApi, productApi, reviewApi } from "@/lib/api";
import { Product, Review, ProductVariant } from "@/types";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { sumVariantStock } from "@/lib/productStock";
import { ProductDetailSkeleton } from "@/components/ui/SkeletonLoader";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import GiftCustomizationModal from "@/components/gifting/GiftCustomizationModal";

interface Props {
  slug: string;
}

interface ReviewEligibility {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  orderId: string | null;
}

interface ReviewFormState {
  rating: number;
  title: string;
  comment: string;
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className='flex gap-1'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className='transition-transform hover:scale-110'
          aria-label={`${n} star`}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hovered || value) >= n ?
                "fill-gold-400 text-gold-400"
              : "fill-gray-200 text-gray-200",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors: Record<string, string> = {
    "5": "bg-[#10b981]", // Green
    "4": "bg-[#10b981]", // Green
    "3": "bg-[#ffb400]", // Yellow/Gold
    "2": "bg-[#ff8a00]", // Orange
    "1": "bg-[#f44336]", // Red
  };
  const labels: Record<string, string> = {
    "5": "Excellent",
    "4": "Very Good",
    "3": "Good",
    "2": "Average",
    "1": "Poor",
  };

  return (
    <div className='flex items-center gap-4 group cursor-default'>
      <span className='text-[13px] font-medium text-gray-600 w-20 shrink-0'>
        {labels[label] || label}
      </span>
      <div className='flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative'>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            colors[label] || "bg-brand-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className='text-[13px] font-bold text-gray-400 w-10 shrink-0 text-right group-hover:text-gray-900 transition-colors'>
        {count}
      </span>
    </div>
  );
}

export default function ProductDetailClient({ slug }: Props) {
  /* Core */
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Gallery */
  const [selectedImage, setSelectedImage] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  /* Variant / Qty */
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);

  /* Actions */
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [customFieldAnswers, setCustomFieldAnswers] = useState<
    Record<string, string>
  >({});
  const [uploadingFieldImages, setUploadingFieldImages] = useState<
    Record<string, boolean>
  >({});

  /* Info tabs (Description / Product Details) */
  const [activeInfoTab, setActiveInfoTab] = useState<"description" | "details">(
    "description",
  );
  const [descExpanded, setDescExpanded] = useState(false);

  /* Related + More */
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [moreProducts, setMoreProducts] = useState<Product[]>([]);

  /* Reviews */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<
    { _id: number; count: number }[]
  >([]);
  const [reviewsPagination, setReviewsPagination] = useState({
    totalPages: 1,
    total: 0,
  });
  const [reviewEligibility, setReviewEligibility] =
    useState<ReviewEligibility | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    rating: 5,
    title: "",
    comment: "",
  });
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [expandedReviewPhotos, setExpandedReviewPhotos] = useState<
    Record<string, boolean>
  >({});
  const [reviewLightbox, setReviewLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [isVotingHelpful, setIsVotingHelpful] = useState<
    Record<string, boolean>
  >({});
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(
    null,
  );
  const [reportTarget, setReportTarget] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState<
    "spam" | "abusive" | "misleading" | "other"
  >("spam");
  const [reportDetails, setReportDetails] = useState("");

  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  /* Initial fetch */
  useEffect(() => {
    setIsLoading(true);
    setSelectedImage(0);
    setReviews([]);
    setRelatedProducts([]);
    setMoreProducts([]);
    setReviewEligibility(null);
    setShowReviewForm(false);

    const fetchAll = async () => {
      try {
        const main = await productApi.getBySlug(slug);
        const p = main.data.product as Product;
        setProduct(p);
        const variants = p.variants || [];
        setSelectedVariant(variants.find((v) => v.stock > 0) || variants[0]);

        let bestRelated: Product[] = [];
        const [reviewsRes, relatedRes, moreRes] = await Promise.allSettled([
          reviewApi.getProductReviews(p._id),
          productApi.getByCategory(p.category, { limit: 40 }),
          productApi.getAll({ limit: 48, sort: "-createdAt" }),
        ]);

        if (reviewsRes.status === "fulfilled") {
          const rv = reviewsRes.value;
          setReviews(rv.data.reviews || []);
          setRatingDistribution(rv.ratingDistribution || []);
          setReviewsPagination(rv.pagination || { totalPages: 1, total: 0 });
        }
        const isGiftBaseProduct =
          p.isGiftable ||
          p.category?.toLowerCase() === "gifting" ||
          p.isCustomizable;

        if (relatedRes.status === "fulfilled") {
          const all: Product[] = relatedRes.value.data?.products || [];
          const scoped =
            isGiftBaseProduct ?
              all.filter(
                (r) =>
                  r.isGiftable ||
                  r.category?.toLowerCase() === "gifting" ||
                  r.isCustomizable,
              )
            : all.filter(
                (r) => !r.isGiftable && r.category?.toLowerCase() !== "gifting",
              );
          const baseColors = new Set(
            (p.variants || [])
              .map((v) => v.color)
              .filter(Boolean)
              .map((c) => String(c).toLowerCase().trim()),
          );
          const baseTags = new Set(
            (p.tags || []).map((t) => String(t).toLowerCase().trim()),
          );
          const baseSub = p.subcategory?.toLowerCase().trim();
          const baseFab = p.fabric?.toLowerCase().trim();

          const scored = scoped
            .filter((r) => r._id !== p._id)
            .map((r) => {
              let score = 0;
              const isGiftingCategory =
                p.category?.toLowerCase() === "gifting" || p.isCustomizable;

              if (isGiftingCategory) {
                // Gifting Specific Logic
                const baseOccasions = new Set(
                  (p.giftOccasions || []).map((o) =>
                    String(o).toLowerCase().trim(),
                  ),
                );
                const rOccasions = new Set(
                  (r.giftOccasions || []).map((o) =>
                    String(o).toLowerCase().trim(),
                  ),
                );
                let occasionOverlap = 0;
                rOccasions.forEach((o) => {
                  if (baseOccasions.has(o)) occasionOverlap += 1;
                });
                score += Math.min(occasionOverlap, 3) * 50;

                if (p.isCustomizable === r.isCustomizable) score += 40;

                const rTags = new Set(
                  (r.tags || []).map((t) => String(t).toLowerCase().trim()),
                );
                let tagOverlap = 0;
                rTags.forEach((t) => {
                  if (baseTags.has(t)) tagOverlap += 1;
                });
                score += Math.min(tagOverlap, 5) * 10;
              } else {
                // Apparel / Standard Product Logic (Sarees, etc)
                const rSub = r.subcategory?.toLowerCase().trim();
                const rFab = r.fabric?.toLowerCase().trim();

                if (baseSub && rSub && baseSub === rSub) score += 60;
                if (baseFab && rFab && baseFab === rFab) score += 40;

                const rColors = new Set(
                  (r.variants || [])
                    .map((v) => v.color)
                    .filter(Boolean)
                    .map((c) => String(c).toLowerCase().trim()),
                );
                let colorOverlap = 0;
                rColors.forEach((c) => {
                  if (baseColors.has(c)) colorOverlap += 1;
                });
                score += Math.min(colorOverlap, 3) * 15;

                const rTags = new Set(
                  (r.tags || []).map((t) => String(t).toLowerCase().trim()),
                );
                let tagOverlap = 0;
                rTags.forEach((t) => {
                  if (baseTags.has(t)) tagOverlap += 1;
                });
                score += Math.min(tagOverlap, 4) * 6;
              }

              // Name Similarity Scoring
              const pLower = p.name.toLowerCase();
              const rLower = r.name.toLowerCase();
              const pKeywords = pLower.split(/\s+/).filter((k) => k.length > 2);
              let nameMatchScore = 0;
              pKeywords.forEach((keyword) => {
                if (rLower.includes(keyword)) nameMatchScore += 15;
              });
              score += Math.min(nameMatchScore, 45);

              // Gentle preference for better rated / in-stock items
              if (sumVariantStock(r) > 0) score += 6;
              score += Math.round((r.ratings?.average || 0) * 2);
              score += Math.min(r.ratings?.count || 0, 50) / 10;

              return { r, score };
            })
            .sort((a, b) => b.score - a.score)
            .map(({ r }) => r)
            .slice(0, 8);

          bestRelated = scored;
          setRelatedProducts(scored);
        }
        if (moreRes.status === "fulfilled") {
          const all: Product[] = moreRes.value.data?.products || [];
          const scoped =
            isGiftBaseProduct ?
              all.filter(
                (r) =>
                  r.isGiftable ||
                  r.category?.toLowerCase() === "gifting" ||
                  r.isCustomizable,
              )
            : all.filter(
                (r) => !r.isGiftable && r.category?.toLowerCase() !== "gifting",
              );
          const exclude = new Set<string>([
            p._id,
            ...bestRelated.map((x) => x._id),
          ]);
          setMoreProducts(
            scoped.filter((r) => !exclude.has(r._id)).slice(0, 8),
          );
        }
      } catch {
        /* not found */
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [slug]);

  /* Review eligibility (only when authenticated & product loaded) */
  useEffect(() => {
    if (!isAuthenticated || !product) return;
    reviewApi
      .canReview(product._id)
      .then((body) =>
        setReviewEligibility({
          canReview: body.data.canReview,
          hasPurchased: body.data.hasPurchased ?? false,
          hasReviewed: body.data.hasReviewed ?? false,
          orderId: body.data.orderId ? String(body.data.orderId) : null,
        }),
      )
      .catch(() => {});
  }, [isAuthenticated, product]);

  /* Analytics: one counted view per product per browser session */
  useEffect(() => {
    if (!product?.slug) return;
    const key = `hor_pv_${product.slug}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key))
        return;
      if (typeof sessionStorage !== "undefined")
        sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked */
    }
    productApi.recordView(product.slug).catch(() => {});
  }, [product?.slug]);

  /* Derived */
  const inWishlist = product ? isInWishlist(product._id) : false;
  const discountPct = useMemo(
    () =>
      product?.comparePrice ?
        Math.round(
          ((product.comparePrice - (product?.price || 0)) /
            product.comparePrice) *
            100,
        )
      : 0,
    [product?.comparePrice, product?.price],
  );
  const selectedPrice = selectedVariant?.price || product?.price || 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;
  const variants = product?.variants || [];
  const sizes = useMemo(
    () =>
      Array.from(new Set(variants.filter((v) => v.size).map((v) => v.size!))),
    [variants],
  );
  const colors = useMemo(
    () =>
      Array.from(new Set(variants.filter((v) => v.color).map((v) => v.color!))),
    [variants],
  );
  const getVariant = (size?: string, color?: string) =>
    variants.find(
      (v) => (!size || v.size === size) && (!color || v.color === color),
    );
  const totalReviews = reviewsPagination.total;
  const previewReviewCount = 5;
  const visibleReviews = useMemo(
    () => reviews.slice(0, previewReviewCount),
    [reviews],
  );
  const positiveReviewsPercent = useMemo(
    () =>
      Math.round(
        (reviews.filter((r) => r.rating >= 4).length / (reviews.length || 1)) *
          100,
      ),
    [reviews],
  );
  useEffect(() => {
    return () => {
      reviewPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [reviewPreviews]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4'>
        <Package className='w-16 h-16 text-gray-200' />
        <h2 className='text-xl font-semibold text-gray-700'>
          Product not found
        </h2>
        <Link href='/shop' className='text-sm text-brand-600 underline'>
          Browse all products
        </Link>
      </div>
    );
  }
  const isGiftingVisual =
    product.category?.toLowerCase() === "gifting" ||
    !!product.isGiftable ||
    !!product.isCustomizable;

  /* Actions */
  const requireAuth = (msg: string) => {
    toast.error(msg);
    router.push(
      "/auth/login?redirect=" + encodeURIComponent(window.location.pathname),
    );
    return false;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) return requireAuth("Sign in to add items to cart");
    if (!selectedVariant || isOutOfStock) return;

    // Validate inline fields (if any)
    if (product.customFields && product.customFields.length > 0) {
      const missing = product.customFields.find(
        (f) => f.isRequired && !customFieldAnswers[f.label]?.trim(),
      );
      if (missing) {
        toast.error(`Please fill in: ${missing.label}`);
        return;
      }
    }

    setIsAddingToCart(true);
    try {
      const answersArray = Object.entries(customFieldAnswers).map(
        ([label, value]) => ({ label, value }),
      );
      await addToCart(
        product._id,
        {
          sku: selectedVariant.sku,
          size: selectedVariant.size,
          color: selectedVariant.color,
        },
        quantity,
        answersArray.length > 0 ? answersArray : undefined,
      );
    } catch {
      /* handled */
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) return requireAuth("Sign in to buy now");
    if (!selectedVariant || isOutOfStock) return;

    // Validate inline fields (if any)
    if (product.customFields && product.customFields.length > 0) {
      const missing = product.customFields.find(
        (f) => f.isRequired && !customFieldAnswers[f.label]?.trim(),
      );
      if (missing) {
        toast.error(`Please fill in: ${missing.label}`);
        return;
      }
    }

    setIsBuyingNow(true);
    try {
      const answersArray = Object.entries(customFieldAnswers).map(
        ([label, value]) => ({ label, value }),
      );
      await addToCart(
        product._id,
        {
          sku: selectedVariant.sku,
          size: selectedVariant.size,
          color: selectedVariant.color,
        },
        quantity,
        answersArray.length > 0 ? answersArray : undefined,
      );
      router.push("/checkout");
    } catch {
      /* handled */
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) return requireAuth("Sign in to save to wishlist");
    await toggleWishlist(product._id);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleCustomFieldImageUpload = async (
    fieldLabel: string,
    file?: File,
  ) => {
    if (!file) return;
    if (!isAuthenticated) {
      requireAuth("Sign in to upload image");
      return;
    }
    setUploadingFieldImages((prev) => ({ ...prev, [fieldLabel]: true }));
    try {
      const fd = new FormData();
      fd.append("images", file);
      const res = await cartApi.uploadCustomFieldImage(fd);
      const imageUrl = (res.data as { image?: { url?: string } })?.image?.url;
      if (!imageUrl) throw new Error("Upload failed");
      setCustomFieldAnswers((prev) => ({ ...prev, [fieldLabel]: imageUrl }));
      toast.success("Image attached");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to upload image",
      );
    } finally {
      setUploadingFieldImages((prev) => ({ ...prev, [fieldLabel]: false }));
    }
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewImages.length > 3) {
      toast.error("You can only upload up to 3 images");
      return;
    }

    const newFiles = [...reviewImages, ...files].slice(0, 3);
    setReviewImages(newFiles);

    reviewPreviews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setReviewPreviews(newPreviews);
  };

  const removeReviewImage = (index: number) => {
    const newFiles = reviewImages.filter((_, i) => i !== index);
    const newPreviews = reviewPreviews.filter((_, i) => i !== index);
    const removed = reviewPreviews[index];
    if (removed) URL.revokeObjectURL(removed);
    setReviewImages(newFiles);
    setReviewPreviews(newPreviews);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEligibility?.orderId) return;
    if (!reviewForm.comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append("rating", String(reviewForm.rating));
      formData.append("title", reviewForm.title);
      formData.append("comment", reviewForm.comment);
      formData.append("orderId", reviewEligibility.orderId);

      reviewImages.forEach((img) => {
        formData.append("images", img);
      });

      const created = await reviewApi.create(product!._id, formData);
      const newReview: Review = created.data.review;

      setReviews((prev) => [newReview, ...prev]);
      setReviewsPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      setReviewEligibility((prev) =>
        prev ? { ...prev, canReview: false, hasReviewed: true } : prev,
      );

      // Reset form
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
      setReviewImages([]);
      setReviewPreviews([]);

      toast.success("Review submitted! Thank you.");
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "Failed to submit review";
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const updateHelpfulCountLocally = (
    reviewId: string,
    helpfulCount: number,
  ) => {
    const votes = Array.from({ length: helpfulCount }, () => "");
    setReviews((prev) =>
      prev.map((review) =>
        review._id === reviewId ? { ...review, helpfulVotes: votes } : review,
      ),
    );
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!isAuthenticated) return requireAuth("Sign in to vote helpful");
    if (isVotingHelpful[reviewId]) return;

    setIsVotingHelpful((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await reviewApi.voteHelpful(reviewId);
      updateHelpfulCountLocally(reviewId, res.data.helpfulCount);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to vote");
    } finally {
      setIsVotingHelpful((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const openReportReview = (review: Review) => {
    if (!isAuthenticated) return requireAuth("Sign in to report review");
    setReportTarget(review);
    setReportReason("spam");
    setReportDetails("");
  };

  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    if (reportingReviewId) return;

    setReportingReviewId(reportTarget._id);
    try {
      await reviewApi.report(reportTarget._id, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      toast.success("Report submitted. Our team will review it.");
      setReportTarget(null);
      setReportDetails("");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to report review",
      );
    } finally {
      setReportingReviewId(null);
    }
  };

  /* JSX */
  /* Bottom padding for store mobile tab bar only (CTAs are inline, not fixed) */
  const mobileBottomReserve =
    "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8";

  return (
    <div className={cn("bg-white min-h-screen", mobileBottomReserve)}>
      {/* Breadcrumb */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2'>
        <nav className='flex items-center gap-1.5 text-xs text-gray-400 flex-wrap'>
          <Link href='/' className='hover:text-brand-600 transition-colors'>
            Home
          </Link>
          <ChevronRight className='h-3 w-3' />
          <Link href='/shop' className='hover:text-brand-600 transition-colors'>
            Shop
          </Link>
          <ChevronRight className='h-3 w-3' />
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className='hover:text-brand-600 transition-colors'
          >
            {product.category}
          </Link>
          <ChevronRight className='h-3 w-3' />
          <span className='text-gray-600 font-medium truncate max-w-[180px]'>
            {product.name}
          </span>
        </nav>
      </div>

      {/* HERO - Gallery + Info */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 xl:gap-10'>
          {/* Gallery */}
          <div className='relative flex gap-3.5 lg:gap-5 overflow-visible'>
            {/* Desktop vertical thumbnail strip */}
            {product.images.length > 1 && (
              <div
                ref={thumbsRef}
                className='hidden lg:flex flex-col gap-2 w-[88px] flex-shrink-0 overflow-y-auto scrollbar-hide relative z-30'
                style={{
                  marginLeft:
                    "calc(-1 * (max((100vw - 1280px) / 2, 0px) + 2rem) + 12px)",
                }}
              >
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setSelectedImage(i)}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "flex-shrink-0 w-full overflow-hidden rounded-xl border-2 transition-all duration-150 bg-gray-50",
                      i === selectedImage ?
                        "border-brand-600 ring-2 ring-brand-100"
                      : "border-gray-200 hover:border-brand-400",
                    )}
                    style={{ aspectRatio: isGiftingVisual ? "1/1" : "3/4" }}
                  >
                    <div className='relative w-full h-full'>
                      <Image
                        src={img.url}
                        alt={img.alt || `${product.name} ${i + 1}`}
                        fill
                        sizes='88px'
                        className={isGiftingVisual ? "object-cover" : "object-contain"}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className='flex-1 space-y-3'>
              <div
                className='relative w-full overflow-hidden rounded-2xl bg-gray-50'
                style={{ aspectRatio: isGiftingVisual ? "1/1" : "3/4" }}
              >
                {product.images[selectedImage]?.url ?
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt || product.name}
                    fill
                    sizes='(max-width: 1024px) 100vw, 50vw'
                    className={cn(
                      "transition-opacity duration-200",
                      isGiftingVisual ? "object-cover" : "object-contain",
                    )}
                    priority
                  />
                : <div className='absolute inset-0 flex items-center justify-center text-gray-300'>
                    <Package className='w-20 h-20' />
                  </div>
                }

                {/* Badges */}
                <div className='absolute top-3 left-3 flex flex-col gap-1.5 z-10'>
                  {discountPct > 0 && (
                    <span className='text-xs font-bold bg-brand-600 text-white px-2.5 py-1 rounded-full shadow'>
                      -{discountPct}% OFF
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className='text-xs font-bold bg-gold-500 text-white px-2.5 py-1 rounded-full shadow flex items-center gap-1'>
                      <Star className='w-3 h-3 fill-white' /> Editor&apos;s Pick
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className='text-xs font-semibold bg-gray-800/80 text-white px-2.5 py-1 rounded-full'>
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Wishlist + Share */}
                <div className='absolute top-3 right-3 flex flex-col gap-2 z-10'>
                  <button
                    onClick={handleWishlist}
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-all",
                      inWishlist ?
                        "bg-brand-600 text-white"
                      : "bg-white/90 text-gray-600 hover:bg-white hover:text-brand-600",
                    )}
                    aria-label='Wishlist'
                  >
                    <Heart
                      className={cn("h-4 w-4", inWishlist && "fill-current")}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className='h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-navy-700 flex items-center justify-center shadow-md transition-all'
                    aria-label='Share'
                  >
                    {copied ?
                      <Check className='h-4 w-4 text-green-500' />
                    : <Share2 className='h-4 w-4' />}
                  </button>
                </div>

                {/* Mobile prev/next */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage(
                          (selectedImage - 1 + product.images.length) %
                            product.images.length,
                        )
                      }
                      className='lg:hidden absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-600 z-10'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage(
                          (selectedImage + 1) % product.images.length,
                        )
                      }
                      className='lg:hidden absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-600 z-10'
                    >
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile horizontal thumbnails */}
              {product.images.length > 1 && (
                <div className='lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1'>
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "flex-shrink-0 w-14 overflow-hidden rounded-lg border-2 transition-all bg-gray-50",
                        i === selectedImage ?
                          "border-brand-600 ring-2 ring-brand-200"
                        : "border-transparent hover:border-brand-400",
                      )}
                      style={{ aspectRatio: isGiftingVisual ? "1/1" : "3/4" }}
                    >
                      <div className='relative w-full h-full'>
                        <Image
                          src={img.url}
                          alt={img.alt || `${product.name} ${i + 1}`}
                          fill
                          sizes='56px'
                          className={isGiftingVisual ? "object-cover" : "object-contain"}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className='space-y-4 sm:space-y-5'>
            {/* Category chips */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full'>
                {product.category}
              </span>
              {product.fabric && (
                <span className='text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full'>
                  {product.fabric}
                </span>
              )}
              {product.subcategory && (
                <span className='text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full'>
                  {product.subcategory}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className='text-2xl sm:text-3xl font-serif font-bold text-navy-900 leading-tight break-words'>
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className='text-sm text-gray-500 mt-2 leading-relaxed'>
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Rating */}
            {product.ratings.count > 0 && (
              <div className='flex items-center gap-2.5'>
                <div className='flex items-center gap-0.5'>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.round(product.ratings.average) ?
                          "fill-gold-400 text-gold-400"
                        : "fill-gray-200 text-gray-200",
                      )}
                    />
                  ))}
                </div>
                <span className='text-sm font-semibold text-gray-800'>
                  {product.ratings.average}
                </span>
                <a
                  href='#reviews-section'
                  className='text-sm text-gray-400 hover:text-brand-600 transition-colors'
                >
                  ({product.ratings.count}{" "}
                  {product.ratings.count === 1 ? "review" : "reviews"})
                </a>
              </div>
            )}

            {/* Price */}
            <div className='bg-gray-50 rounded-2xl p-3 sm:p-4 space-y-1'>
              <div className='flex items-baseline flex-wrap gap-3'>
                <span className='text-3xl font-bold text-navy-900'>
                  {formatPrice(selectedPrice)}
                </span>
                {product.comparePrice &&
                  product.comparePrice > selectedPrice && (
                    <span className='text-lg text-gray-400 line-through'>
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
              </div>
              {discountPct > 0 && (
                <p className='text-sm font-semibold text-green-600'>
                  You save {formatPrice(product.comparePrice! - selectedPrice)}{" "}
                  ({discountPct}% off)
                </p>
              )}
              <p className='text-xs text-gray-400'>
                Inclusive of all taxes - Free delivery above Rs. 999
              </p>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-sm font-semibold text-gray-900'>
                    Size:{" "}
                    <span className='text-brand-700 font-bold'>
                      {selectedVariant?.size || "Select"}
                    </span>
                  </p>
                  <button className='text-xs text-brand-600 hover:underline'>
                    Size guide
                  </button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {sizes.map((size) => {
                    const v = getVariant(size, selectedVariant?.color);
                    const ok = v && v.stock > 0;
                    return (
                      <button
                        key={size}
                        onClick={() => v && setSelectedVariant(v)}
                        disabled={!ok}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                          selectedVariant?.size === size ?
                            "border-brand-600 bg-brand-600 text-white shadow-md"
                          : ok ?
                            "border-gray-200 text-gray-700 hover:border-brand-400 hover:bg-brand-50"
                          : "border-gray-100 text-gray-300 cursor-not-allowed line-through",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p className='text-sm font-semibold text-gray-900 mb-2'>
                  Color:{" "}
                  <span className='text-brand-700 font-bold'>
                    {selectedVariant?.color || "Select"}
                  </span>
                </p>
                <div className='flex flex-wrap gap-2'>
                  {colors.map((color) => {
                    const v = getVariant(selectedVariant?.size, color);
                    const ok = v && v.stock > 0;
                    return (
                      <button
                        key={color}
                        onClick={() => v && setSelectedVariant(v)}
                        disabled={!ok}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                          selectedVariant?.color === color ?
                            "border-brand-600 bg-brand-600 text-white shadow-md"
                          : ok ?
                            "border-gray-200 text-gray-700 hover:border-brand-400 hover:bg-brand-50"
                          : "border-gray-100 text-gray-300 cursor-not-allowed",
                        )}
                      >
                        {(v as ProductVariant & { colorCode?: string })
                          ?.colorCode && (
                          <span
                            className='h-3.5 w-3.5 rounded-full border border-white/50 shadow-inner'
                            style={{
                              background: (
                                v as ProductVariant & { colorCode?: string }
                              )?.colorCode,
                            }}
                          />
                        )}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + stock badge */}
            <div className='flex items-center gap-4 flex-wrap'>
              <div>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>
                  Quantity
                </p>
                <div className='inline-flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50'>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className='px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors'
                  >
                    <Minus className='h-4 w-4' />
                  </button>
                  <span className='px-5 py-2.5 text-sm font-bold text-gray-900 min-w-[3rem] text-center border-x border-gray-200'>
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(selectedVariant?.stock || 10, quantity + 1),
                      )
                    }
                    disabled={quantity >= (selectedVariant?.stock || 10)}
                    className='px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'
                  >
                    <Plus className='h-4 w-4' />
                  </button>
                </div>
              </div>
              {selectedVariant && (
                <div className='pt-5'>
                  {selectedVariant.stock === 0 ?
                    <span className='text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full'>
                      Out of Stock
                    </span>
                  : selectedVariant.stock <= 5 ?
                    <span className='text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full animate-pulse'>
                      Only a few left!
                    </span>
                  : null}
                </div>
              )}
            </div>

            {/* Inline Gifting Fields */}
            {Array.isArray(product?.customFields) &&
              product.customFields.length > 0 && (
                <div className='bg-gold-50/30 border border-gold-100/50 rounded-2xl p-5 space-y-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Gift className='h-4 w-4 text-gold-600' />
                    <h3 className='text-sm font-bold text-navy-900'>
                      Personalize your Gift
                    </h3>
                  </div>
                  <div className='space-y-3.5'>
                    {(product.customFields || []).map((field) => (
                      <div
                        key={product._id + field.label}
                        className='space-y-1.5'
                      >
                        <label className='block text-xs font-bold text-gray-700 uppercase tracking-tight'>
                          {field.label}{" "}
                          {field.isRequired && (
                            <span className='text-red-500'>*</span>
                          )}
                        </label>
                        {field.fieldType === "select" ?
                          <select
                            value={customFieldAnswers[field.label] || ""}
                            onChange={(e) =>
                              setCustomFieldAnswers((prev) => ({
                                ...prev,
                                [field.label]: e.target.value,
                              }))
                            }
                            className='w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all'
                          >
                            <option value=''>Select option</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        : field.fieldType === "textarea" ?
                          <textarea
                            placeholder={
                              field.placeholder ||
                              `Enter ${field.label.toLowerCase()}...`
                            }
                            value={customFieldAnswers[field.label] || ""}
                            onChange={(e) =>
                              setCustomFieldAnswers((prev) => ({
                                ...prev,
                                [field.label]: e.target.value,
                              }))
                            }
                            rows={3}
                            className='w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all resize-none'
                          />
                        : field.fieldType === "image" ?
                          <div className='space-y-2'>
                            <label className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50'>
                              {uploadingFieldImages[field.label] ?
                                "Uploading..."
                              : "Upload image"}
                              <input
                                type='file'
                                accept='image/*'
                                className='hidden'
                                disabled={!!uploadingFieldImages[field.label]}
                                onChange={(e) =>
                                  handleCustomFieldImageUpload(
                                    field.label,
                                    e.target.files?.[0],
                                  )
                                }
                              />
                            </label>
                            {customFieldAnswers[field.label] && (
                              <div className='relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200'>
                                <Image
                                  src={customFieldAnswers[field.label]}
                                  alt={field.label}
                                  fill
                                  className='object-cover'
                                  sizes='80px'
                                />
                              </div>
                            )}
                          </div>
                        : <input
                            type='text'
                            placeholder={
                              field.placeholder ||
                              `Enter ${field.label.toLowerCase()}...`
                            }
                            value={customFieldAnswers[field.label] || ""}
                            onChange={(e) =>
                              setCustomFieldAnswers((prev) => ({
                                ...prev,
                                [field.label]: e.target.value,
                              }))
                            }
                            className='w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all'
                          />
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* CTA - Triple-CTA Architecture */}
            <div className='flex flex-col gap-4 pt-4'>
              {/* Primary Add/Buy Buttons */}
              <div className='flex gap-3 min-w-0'>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAddingToCart}
                  className={cn(
                    "flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                    isOutOfStock ?
                      "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white",
                  )}
                >
                  {isAddingToCart ?
                    <>
                      <span className='h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin' />{" "}
                      Adding...
                    </>
                  : <>
                      <ShoppingBag className='h-4 w-4' /> Add to Cart
                    </>
                  }
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isBuyingNow}
                  className={cn(
                    "flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                    isOutOfStock ?
                      "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200",
                  )}
                >
                  {isBuyingNow ?
                    <>
                      <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />{" "}
                      Processing...
                    </>
                  : <>
                      <Zap className='h-4 w-4' /> Buy Now
                    </>
                  }
                </button>
              </div>

              {/* Request Customization Button (Only for isCustomizable) */}
              {product.isCustomizable && (
                <button
                  onClick={() => setIsGiftModalOpen(true)}
                  className='w-full py-3.5 rounded-2xl bg-gold-500 hover:bg-gold-600 text-white font-bold text-sm shadow-xl shadow-gold-500/20 flex items-center justify-center gap-2.5 transition-all group active:scale-95'
                >
                  <Gift className='h-5 w-5 group-hover:rotate-12 transition-transform' />
                  REQUEST CUSTOMIZATION & QUOTE
                </button>
              )}

              {/* Wishlist Button (Full width on mobile, integrated into flow) */}
              <button
                onClick={handleWishlist}
                className={cn(
                  "w-full py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all",
                  inWishlist ?
                    "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-600 shadow-sm",
                )}
              >
                <Heart
                  className={cn("h-5 w-5", inWishlist && "fill-current")}
                />
                <span className='text-sm font-bold'>
                  {inWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
                </span>
              </button>
            </div>

            {/* Trust badges */}
            <div className='grid grid-cols-3 gap-3'>
              {[
                { icon: Truck, label: "Free Delivery", sub: "Above Rs. 999" },
                { icon: RotateCcw, label: "Easy Return", sub: "7 days" },
                {
                  icon: ShieldCheck,
                  label: "100% Authentic",
                  sub: "Guaranteed",
                },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className='flex flex-col items-center gap-1.5 p-3 bg-navy-50 rounded-2xl text-center border border-navy-100'
                >
                  <Icon className='h-5 w-5 text-navy-700' />
                  <span className='text-xs font-semibold text-navy-900'>
                    {label}
                  </span>
                  <span className='text-xs text-gray-400'>{sub}</span>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <div className='flex items-start gap-3 p-3.5 bg-green-50 rounded-xl border border-green-100'>
              <MapPin className='h-4 w-4 text-green-600 mt-0.5 flex-shrink-0' />
              <p className='text-xs text-green-800'>
                <span className='font-semibold'>
                  Estimated delivery in 3-7 business days.
                </span>{" "}
                Free shipping on orders above Rs. 999. Express delivery available
                at checkout.
              </p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/shop?search=${encodeURIComponent(tag)}`}
                    className='text-xs text-gray-500 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 px-2.5 py-1 rounded-full transition-colors'
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESCRIPTION / DETAILS */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mt-4'>
        <div className='border border-gray-100 rounded-2xl overflow-hidden'>
          {/* Tab header */}
          <div className='flex border-b border-gray-100 bg-gray-50/60'>
            {(["description", "details"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveInfoTab(tab)}
                className={cn(
                  "flex-1 sm:flex-none px-6 py-4 text-sm font-semibold transition-all",
                  activeInfoTab === tab ?
                    "bg-white text-brand-700 border-b-2 border-brand-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700",
                )}
              >
                {tab === "description" ? "Description" : "Product Details"}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeInfoTab === "description" && (
            <div className='p-6 sm:p-8'>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  !descExpanded && product.description.length > 400 ?
                    "max-h-32"
                  : "max-h-none",
                )}
              >
                <p className='text-gray-700 leading-8 text-[15px] whitespace-pre-wrap break-words'>
                  {product.description}
                </p>
              </div>
              {product.description.length > 400 && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className='mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors'
                >
                  {descExpanded ?
                    <>
                      <ChevronUp className='h-4 w-4' /> Show less
                    </>
                  : <>
                      <ChevronDown className='h-4 w-4' /> Read more
                    </>
                  }
                </button>
              )}
            </div>
          )}

          {/* Product Details */}
          {activeInfoTab === "details" && (
            <div className='p-6 sm:p-8'>
              <dl className='space-y-0 divide-y divide-gray-50'>
                {[
                  { label: "Category", value: product.category },
                  product.subcategory ?
                    { label: "Subcategory", value: product.subcategory }
                  : null,
                  product.fabric ?
                    { label: "Fabric", value: product.fabric }
                  : null,
                  {
                    label: "SKU",
                    value:
                      selectedVariant?.sku ||
                      (product.variants && product.variants[0]?.sku) ||
                      "N/A",
                  },
                  product.tags.length > 0 ?
                    { label: "Tags", value: product.tags.join(", ") }
                  : null,
                  ...(product.productDetails || []).map((d) =>
                    d.key && d.value ? { label: d.key, value: d.value } : null,
                  ),
                ]
                  .filter(Boolean)
                  .map((row) => {
                    const r = row as { label: string; value: string };
                    return (
                      <div key={r.label} className='flex gap-4 py-3'>
                        <dt className='w-32 flex-shrink-0 text-sm font-semibold text-gray-500'>
                          {r.label}
                        </dt>
                        <dd className='text-sm text-gray-900 flex-1 break-words'>
                          {r.value}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* REVIEWS */}
      <section id='reviews-section' className='py-8 sm:py-12 bg-[#faf9f7]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section header */}
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

            {/* Write review CTA */}
            {isAuthenticated ?
              reviewEligibility?.canReview ?
                <button
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
                // : reviewEligibility && !reviewEligibility.hasPurchased ?
                //   <div className='flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl'>
                //     <Package className='h-4 w-4 text-gray-400' />
                //     <span className='text-xs text-gray-500 font-medium'>
                //       Available after delivered purchase
                //     </span>
                //   </div>
              : null
            : <Link
                href='/auth/login'
                className='text-sm text-brand-600 font-bold hover:bg-brand-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2'
              >
                Sign in to review <ChevronRight className='h-4 w-4' />
              </Link>
            }
          </div>

          {/* Write review form */}
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
                  onSubmit={handleSubmitReview}
                  className='space-y-5 sm:space-y-8'
                >
                  <div className='bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100'>
                    <label className='block text-[11px] font-bold text-navy-900 uppercase tracking-widest mb-4'>
                      Select Rating
                    </label>
                    <StarSelector
                      value={reviewForm.rating}
                      onChange={(v) =>
                        setReviewForm((f) => ({ ...f, rating: v }))
                      }
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-6'>
                    <div className='space-y-2'>
                      <label className='block text-xs font-bold text-gray-700 uppercase tracking-tight'>
                        Review Title
                      </label>
                      <input
                        type='text'
                        value={reviewForm.title}
                        onChange={(e) =>
                          setReviewForm((f) => ({
                            ...f,
                            title: e.target.value,
                          }))
                        }
                        maxLength={100}
                        placeholder="Summarize your experience (e.g., 'Amazing Quality', 'Perfect Fit')"
                        className='w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-400 placeholder-gray-400 transition-all bg-white'
                      />
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

                  {/* Image Upload Redesign */}
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
                            onClick={() => removeReviewImage(i)}
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
                            onChange={handleReviewImageChange}
                            className='hidden'
                          />
                        </label>
                      )}
                    </div>
                    <p className='text-[10px] text-gray-400 italic'>
                      Images help other shoppers see the product in real life.
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

          {/* Rating summary + reviews list */}
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
              {/* Premium Rating summary sidebar */}
              <div className='bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 h-fit shadow-xl shadow-gray-200/20 self-start z-10'>
                <div className='text-center mb-8 pb-8 border-b border-gray-100'>
                  <div className='flex justify-center items-center gap-3 mb-1'>
                    <p className='text-7xl font-black text-navy-900 tracking-tighter'>
                      {product!.ratings.average}
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
                      (d) => d._id === star,
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

              {/* Review cards */}
              <div className='space-y-6'>
                {visibleReviews.map((review) => (
                  <div
                    key={review._id}
                    className='bg-white rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm hover:shadow-md transition-shadow'
                  >
                    {/* Reviewer header */}
                    <div className='flex items-start justify-between mb-6 gap-4'>
                      <div className='flex items-center gap-4'>
                        <div className='h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-navy-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-100/50 rotate-3'>
                          <span className='text-white font-black text-lg'>
                            {review.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className='text-[15px] font-bold text-gray-900 tracking-tight'>
                            {review.user.name}
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
                      {/* Stars */}
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

                    {/* Review photos: compact horizontal row */}
                    {review.images && review.images.length > 0 && (
                      <div className='mt-4'>
                        <div className='flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide'>
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

                    {/* Helpful vote redesigned */}
                    <div className='mt-8 pt-6 border-t border-gray-50 flex items-center justify-between gap-3'>
                      <button
                        type='button'
                        onClick={() => handleHelpfulVote(review._id)}
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
                        onClick={() => openReportReview(review)}
                        className='text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors inline-flex items-center gap-1'
                      >
                        <Flag className='h-3 w-3' />
                        Report Review
                      </button>
                    </div>

                    {/* Admin reply with premium styling */}
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
                        {review.user.name}
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
                      onClick={() => openReportReview(review)}
                      className='text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 inline-flex items-center gap-1'
                    >
                      <Flag className='h-3 w-3' />
                      Report Review
                    </button>
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className='mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide'>
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

            <form
              onSubmit={handleReportReview}
              className='p-4 sm:p-6 space-y-4'
            >
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

      {/* ══════════════ RELATED PRODUCTS ══════════════ */}
      {relatedProducts.length > 0 && (
        <section className='py-8 sm:py-12 bg-[#faf9f7]'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-end justify-between mb-5 sm:mb-7'>
              <div>
                <p className='text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1'>
                  You might also like
                </p>
                <h2 className='text-xl sm:text-3xl font-serif font-bold text-navy-900'>
                  {(
                    product.isGiftable ||
                    product.category?.toLowerCase() === "gifting" ||
                    product.isCustomizable
                  ) ?
                    "Similar Gift Products"
                  : "Similar Styles"}
                </h2>
              </div>
              <Link
                href={
                  (
                    product.isGiftable ||
                    product.category?.toLowerCase() === "gifting" ||
                    product.isCustomizable
                  ) ?
                    "/gifting"
                  : `/shop?category=${encodeURIComponent(product.category)}${product.fabric ? `&fabric=${encodeURIComponent(product.fabric)}` : ""}`
                }
                className='text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors'
              >
                View all <ChevronRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='sm:hidden flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory'>
              {relatedProducts.slice(0, 8).map((p) => (
                <div
                  key={p._id}
                  className='w-[calc((100vw-2rem-0.75rem)/2)] min-w-[170px] max-w-[240px] flex-shrink-0 snap-start'
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className='hidden sm:grid grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0'>
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ MORE FROM HOUSE OF RANI ══════════════ */}
      {moreProducts.length > 0 && (
        <section className='py-8 sm:py-12 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-end justify-between mb-5 sm:mb-7'>
              <div>
                <p className='text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1'>
                  Curated for you
                </p>
                <h2 className='text-xl sm:text-3xl font-serif font-bold text-navy-900'>
                  {(
                    product.isGiftable ||
                    product.category?.toLowerCase() === "gifting" ||
                    product.isCustomizable
                  ) ?
                    "More Gift Products"
                  : "More from The House of Rani"}
                </h2>
              </div>
              <Link
                href={
                  (
                    product.isGiftable ||
                    product.category?.toLowerCase() === "gifting" ||
                    product.isCustomizable
                  ) ?
                    "/gifting"
                  : "/shop"
                }
                className='text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors'
              >
                Explore all <ChevronRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='sm:hidden flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory'>
              {moreProducts.slice(0, 8).map((p) => (
                <div
                  key={p._id}
                  className='w-[calc((100vw-2rem-0.75rem)/2)] min-w-[170px] max-w-[240px] flex-shrink-0 snap-start'
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className='hidden sm:grid grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0'>
              {moreProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
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

      {isGiftModalOpen && product && (
        <GiftCustomizationModal
          product={product}
          onClose={() => setIsGiftModalOpen(false)}
        />
      )}
    </div>
  );
}
