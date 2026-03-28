"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { productApi, reviewApi } from "@/lib/api";
import { Product, Review, ProductVariant } from "@/types";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { ProductDetailSkeleton } from "@/components/ui/SkeletonLoader";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";

interface Props { slug: string; }

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

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} star`}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hovered || value) >= n ? "fill-gold-400 text-gold-400" : "fill-gray-200 text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-6 text-right shrink-0">{label}</span>
      <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-7 shrink-0">{count}</span>
    </div>
  );
}

export default function ProductDetailClient({ slug }: Props) {
  /* ── Core ── */
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Gallery ── */
  const [selectedImage, setSelectedImage] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  /* ── Variant / Qty ── */
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  /* ── Actions ── */
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Info tabs (Description / Product Details) ── */
  const [activeInfoTab, setActiveInfoTab] = useState<"description" | "details">("description");
  const [descExpanded, setDescExpanded] = useState(false);

  /* ── Related + More ── */
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [moreProducts, setMoreProducts] = useState<Product[]>([]);

  /* ── Reviews ── */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<{ _id: number; count: number }[]>([]);
  const [reviewsPagination, setReviewsPagination] = useState({ totalPages: 1, total: 0 });
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({ rating: 5, title: "", comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  /* ── Initial fetch ── */
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
        setSelectedVariant(p.variants.find((v) => v.stock > 0) || p.variants[0]);

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
        if (relatedRes.status === "fulfilled") {
          const all: Product[] = relatedRes.value.data?.products || [];
          const baseColors = new Set(
            (p.variants || [])
              .map((v) => v.color)
              .filter(Boolean)
              .map((c) => String(c).toLowerCase().trim())
          );
          const baseTags = new Set((p.tags || []).map((t) => String(t).toLowerCase().trim()));
          const baseSub = p.subcategory?.toLowerCase().trim();
          const baseFab = p.fabric?.toLowerCase().trim();

          const scored = all
            .filter((r) => r._id !== p._id)
            .map((r) => {
              let score = 0;
              const rSub = r.subcategory?.toLowerCase().trim();
              const rFab = r.fabric?.toLowerCase().trim();

              if (baseSub && rSub && baseSub === rSub) score += 60;
              if (baseFab && rFab && baseFab === rFab) score += 40;

              const rColors = new Set(
                (r.variants || [])
                  .map((v) => v.color)
                  .filter(Boolean)
                  .map((c) => String(c).toLowerCase().trim())
              );
              let colorOverlap = 0;
              rColors.forEach((c) => {
                if (baseColors.has(c)) colorOverlap += 1;
              });
              score += Math.min(colorOverlap, 3) * 15;

              const rTags = new Set((r.tags || []).map((t) => String(t).toLowerCase().trim()));
              let tagOverlap = 0;
              rTags.forEach((t) => {
                if (baseTags.has(t)) tagOverlap += 1;
              });
              score += Math.min(tagOverlap, 4) * 6;

              // Gentle preference for better rated / in-stock items
              if (r.totalStock > 0) score += 6;
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
          const exclude = new Set<string>([
            p._id,
            ...bestRelated.map((x) => x._id),
          ]);
          setMoreProducts(all.filter((r) => !exclude.has(r._id)).slice(0, 8));
        }
      } catch {
        /* not found */
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [slug]);

  /* ── Review eligibility (only when authenticated & product loaded) ── */
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

  /* ── Analytics: one counted view per product per browser session ── */
  useEffect(() => {
    if (!product?.slug) return;
    const key = `hor_pv_${product.slug}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked */
    }
    productApi.recordView(product.slug).catch(() => {});
  }, [product?.slug]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Package className="w-16 h-16 text-gray-200" />
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <Link href="/shop" className="text-sm text-brand-600 underline">Browse all products</Link>
      </div>
    );
  }

  /* ── Derived ── */
  const inWishlist = isInWishlist(product._id);
  const discountPct = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const selectedPrice = selectedVariant?.price || product.price;
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;
  const sizes = Array.from(new Set(product.variants.filter((v) => v.size).map((v) => v.size!)));
  const colors = Array.from(new Set(product.variants.filter((v) => v.color).map((v) => v.color!)));
  const getVariant = (size?: string, color?: string) =>
    product.variants.find((v) => (!size || v.size === size) && (!color || v.color === color));
  const totalReviews = reviewsPagination.total;

  /* ── Actions ── */
  const requireAuth = (msg: string) => {
    toast.error(msg);
    router.push("/auth/login?redirect=" + encodeURIComponent(window.location.pathname));
    return false;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) return requireAuth("Sign in to add items to cart");
    if (!selectedVariant || isOutOfStock) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product._id, { sku: selectedVariant.sku, size: selectedVariant.size, color: selectedVariant.color }, quantity);
      toast.success("Added to cart!");
    } catch { /* handled */ } finally { setIsAddingToCart(false); }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) return requireAuth("Sign in to buy now");
    if (!selectedVariant || isOutOfStock) return;
    setIsBuyingNow(true);
    try {
      await addToCart(product._id, { sku: selectedVariant.sku, size: selectedVariant.size, color: selectedVariant.color }, quantity);
      router.push("/checkout");
    } catch { /* handled */ } finally { setIsBuyingNow(false); }
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
    } catch { toast.error("Could not copy link"); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEligibility?.orderId) return;
    if (!reviewForm.comment.trim()) { toast.error("Please write a review comment"); return; }
    setIsSubmittingReview(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(reviewForm.rating));
      fd.append("title", reviewForm.title);
      fd.append("comment", reviewForm.comment);
      fd.append("orderId", reviewEligibility.orderId);
      const created = await reviewApi.create(product._id, fd);
      const newReview: Review = created.data.review;
      setReviews((prev) => [newReview, ...prev]);
      setReviewsPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      setReviewEligibility((prev) => prev ? { ...prev, canReview: false, hasReviewed: true } : prev);
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
      toast.success("Review submitted! Thank you.");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to submit review";
      toast.error(msg);
    } finally { setIsSubmittingReview(false); }
  };

  /* ── JSX ── */
  /* Mobile: bottom tab bar (~3.25rem) + sticky CTA bar — avoid overlap / hidden buttons */
  const mobileBottomReserve =
    "pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] sm:pb-0";

  return (
    <div className={cn("bg-white min-h-screen", mobileBottomReserve)}>

      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-brand-600 transition-colors">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-600 transition-colors">{product.category}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-600 font-medium truncate max-w-[180px]">{product.name}</span>
        </nav>
      </div>

      {/* ══════════════ HERO — Gallery + Info ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

          {/* ── Gallery ── */}
          <div className="relative flex gap-3.5 lg:gap-5 overflow-visible">
            {/* Desktop vertical thumbnail strip */}
            {product.images.length > 1 && (
              <div
                ref={thumbsRef}
                className="hidden lg:flex flex-col gap-2 w-[88px] flex-shrink-0 overflow-y-auto scrollbar-hide relative z-30"
                style={{ marginLeft: "calc(-1 * (max((100vw - 1280px) / 2, 0px) + 2rem) + 12px)" }}
              >
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setSelectedImage(i)}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "flex-shrink-0 w-full overflow-hidden rounded-xl border-2 transition-all duration-150 bg-gray-50",
                      i === selectedImage ? "border-brand-600 ring-2 ring-brand-100" : "border-gray-200 hover:border-brand-400"
                    )}
                    style={{ aspectRatio: "3/4" }}
                  >
                    <div className="relative w-full h-full">
                      <Image src={img.url} alt={img.alt || `${product.name} ${i + 1}`} fill sizes="88px" className="object-contain" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 space-y-3">
              <div className="relative w-full overflow-hidden rounded-2xl bg-gray-50" style={{ aspectRatio: "3/4" }}>
                {product.images[selectedImage]?.url ? (
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt || product.name}
                    fill sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain transition-opacity duration-200"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <Package className="w-20 h-20" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discountPct > 0 && (
                    <span className="text-xs font-bold bg-brand-600 text-white px-2.5 py-1 rounded-full shadow">
                      -{discountPct}% OFF
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="text-xs font-bold bg-gold-500 text-white px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Editor&apos;s Pick
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="text-xs font-semibold bg-gray-800/80 text-white px-2.5 py-1 rounded-full">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Wishlist + Share */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                  <button
                    onClick={handleWishlist}
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-all",
                      inWishlist ? "bg-brand-600 text-white" : "bg-white/90 text-gray-600 hover:bg-white hover:text-brand-600"
                    )}
                    aria-label="Wishlist"
                  >
                    <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-navy-700 flex items-center justify-center shadow-md transition-all"
                    aria-label="Share"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                  </button>
                </div>

                {/* Mobile prev/next */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((selectedImage - 1 + product.images.length) % product.images.length)}
                      className="lg:hidden absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-600 z-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((selectedImage + 1) % product.images.length)}
                      className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-600 z-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile horizontal thumbnails */}
              {product.images.length > 1 && (
                <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "flex-shrink-0 w-14 overflow-hidden rounded-lg border-2 transition-all bg-gray-50",
                        i === selectedImage ? "border-brand-600 ring-2 ring-brand-200" : "border-transparent hover:border-brand-400"
                      )}
                      style={{ aspectRatio: "3/4" }}
                    >
                      <div className="relative w-full h-full">
                        <Image src={img.url} alt={img.alt || `${product.name} ${i + 1}`} fill sizes="56px" className="object-contain" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Product Info ── */}
          <div className="space-y-5">
            {/* Category chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">{product.category}</span>
              {product.fabric && <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{product.fabric}</span>}
              {product.subcategory && <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{product.subcategory}</span>}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 leading-tight break-words">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.shortDescription}</p>
              )}
            </div>

            {/* Rating */}
            {product.ratings.count > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < Math.round(product.ratings.average) ? "fill-gold-400 text-gold-400" : "fill-gray-200 text-gray-200")} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-800">{product.ratings.average}</span>
                <a href="#reviews-section" className="text-sm text-gray-400 hover:text-brand-600 transition-colors">
                  ({product.ratings.count} {product.ratings.count === 1 ? "review" : "reviews"})
                </a>
              </div>
            )}

            {/* Price */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
              <div className="flex items-baseline flex-wrap gap-3">
                <span className="text-3xl font-bold text-navy-900">{formatPrice(selectedPrice)}</span>
                {product.comparePrice && product.comparePrice > selectedPrice && (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                )}
              </div>
              {discountPct > 0 && (
                <p className="text-sm font-semibold text-green-600">
                  You save {formatPrice(product.comparePrice! - selectedPrice)} ({discountPct}% off)
                </p>
              )}
              <p className="text-xs text-gray-400">Inclusive of all taxes · Free delivery above ₹999</p>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Size: <span className="text-brand-700 font-bold">{selectedVariant?.size || "Select"}</span>
                  </p>
                  <button className="text-xs text-brand-600 hover:underline">Size guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
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
                          selectedVariant?.size === size ? "border-brand-600 bg-brand-600 text-white shadow-md"
                            : ok ? "border-gray-200 text-gray-700 hover:border-brand-400 hover:bg-brand-50"
                            : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
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
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Color: <span className="text-brand-700 font-bold">{selectedVariant?.color || "Select"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
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
                          selectedVariant?.color === color ? "border-brand-600 bg-brand-600 text-white shadow-md"
                            : ok ? "border-gray-200 text-gray-700 hover:border-brand-400 hover:bg-brand-50"
                            : "border-gray-100 text-gray-300 cursor-not-allowed"
                        )}
                      >
                        {(v as ProductVariant & { colorCode?: string })?.colorCode && (
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/50 shadow-inner"
                            style={{ background: (v as ProductVariant & { colorCode?: string })?.colorCode }}
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
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity</p>
                <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-5 py-2.5 text-sm font-bold text-gray-900 min-w-[3rem] text-center border-x border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || 10, quantity + 1))}
                    disabled={quantity >= (selectedVariant?.stock || 10)}
                    className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {selectedVariant && (
                <div className="pt-5">
                  {selectedVariant.stock === 0 ? (
                    <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">Out of Stock</span>
                  ) : selectedVariant.stock <= 5 ? (
                    <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full animate-pulse">
                      ⚡ Only a few left!
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* CTA — desktop */}
            <div className="hidden sm:flex gap-3 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                  isOutOfStock ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white"
                )}
              >
                {isAddingToCart ? <><span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Adding…</> : <><ShoppingBag className="h-4 w-4" /> Add to Cart</>}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || isBuyingNow}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                  isOutOfStock ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200"
                )}
              >
                {isBuyingNow ? <><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Processing…</> : <><Zap className="h-4 w-4" /> Buy Now</>}
              </button>
              <button
                onClick={handleWishlist}
                className={cn(
                  "py-3.5 px-3.5 rounded-2xl border-2 flex items-center justify-center transition-all",
                  inWishlist ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-600"
                )}
                aria-label="Wishlist"
              >
                <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Free Delivery", sub: "Above ₹999" },
                { icon: RotateCcw, label: "Easy Return", sub: "7 days" },
                { icon: ShieldCheck, label: "100% Authentic", sub: "Guaranteed" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-navy-50 rounded-2xl text-center border border-navy-100">
                  <Icon className="h-5 w-5 text-navy-700" />
                  <span className="text-xs font-semibold text-navy-900">{label}</span>
                  <span className="text-xs text-gray-400">{sub}</span>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <div className="flex items-start gap-3 p-3.5 bg-green-50 rounded-xl border border-green-100">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-800">
                <span className="font-semibold">Estimated delivery in 3-7 business days.</span>{" "}
                Free shipping on orders above ₹999. Express delivery available at checkout.
              </p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link key={tag} href={`/shop?search=${encodeURIComponent(tag)}`}
                    className="text-xs text-gray-500 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 px-2.5 py-1 rounded-full transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ DESCRIPTION / DETAILS ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mt-4">
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-gray-100 bg-gray-50/60">
            {(["description", "details"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveInfoTab(tab)}
                className={cn(
                  "flex-1 sm:flex-none px-6 py-4 text-sm font-semibold transition-all",
                  activeInfoTab === tab ? "bg-white text-brand-700 border-b-2 border-brand-600 -mb-px" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab === "description" ? "Description" : "Product Details"}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeInfoTab === "description" && (
            <div className="p-6 sm:p-8">
              <div className={cn("overflow-hidden transition-all duration-300", !descExpanded && product.description.length > 400 ? "max-h-32" : "max-h-none")}>
                <p className="text-gray-700 leading-8 text-[15px] whitespace-pre-wrap break-words">{product.description}</p>
              </div>
              {product.description.length > 400 && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {descExpanded ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Read more</>}
                </button>
              )}
            </div>
          )}

          {/* Product Details */}
          {activeInfoTab === "details" && (
            <div className="p-6 sm:p-8">
              <dl className="space-y-0 divide-y divide-gray-50">
                {[
                  { label: "Category", value: product.category },
                  product.subcategory ? { label: "Subcategory", value: product.subcategory } : null,
                  product.fabric ? { label: "Fabric", value: product.fabric } : null,
                  { label: "SKU", value: selectedVariant?.sku || product.variants[0]?.sku },
                  product.tags.length > 0 ? { label: "Tags", value: product.tags.join(", ") } : null,
                ]
                  .filter(Boolean)
                  .map((row) => {
                    const r = row as { label: string; value: string };
                    return (
                      <div key={r.label} className="flex gap-4 py-3">
                        <dt className="w-32 flex-shrink-0 text-sm font-semibold text-gray-500">{r.label}</dt>
                        <dd className="text-sm text-gray-900 flex-1 break-words">{r.value}</dd>
                      </div>
                    );
                  })}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ RELATED PRODUCTS ══════════════ */}
      {relatedProducts.length > 0 && (
        <section className="py-12 bg-[#faf9f7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">You might also like</p>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900">Similar Styles</h2>
              </div>
              <Link
                href={`/shop?category=${encodeURIComponent(product.category)}${product.fabric ? `&fabric=${encodeURIComponent(product.fabric)}` : ""}`}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ MORE FROM HOUSE OF RANI ══════════════ */}
      {moreProducts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">Curated for you</p>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900">More from The House of Rani</h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                Explore all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0">
              {moreProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ REVIEWS ══════════════ */}
      <section id="reviews-section" className="py-12 bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">Customer voices</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900">
                Reviews{totalReviews > 0 && <span className="text-gray-400 text-xl ml-2 font-sans font-normal">({totalReviews})</span>}
              </h2>
            </div>

            {/* Write review CTA */}
            {isAuthenticated ? (
              reviewEligibility?.canReview ? (
                <button
                  onClick={() => setShowReviewForm((v) => !v)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Write a Review
                </button>
              ) : reviewEligibility?.hasReviewed ? (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> You&apos;ve reviewed this product
                </span>
              ) : reviewEligibility && !reviewEligibility.hasPurchased ? (
                <span className="text-xs text-gray-400 italic">Purchase &amp; receive to write a review</span>
              ) : null
            ) : (
              <Link href="/auth/login" className="text-sm text-brand-600 font-semibold hover:underline">
                Sign in to write a review
              </Link>
            )}
          </div>

          {/* Write review form */}
          {showReviewForm && reviewEligibility?.canReview && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8 animate-fadeIn">
              <h3 className="font-serif text-lg font-bold text-navy-900 mb-5">Share your experience</h3>
              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your rating *</label>
                  <StarSelector value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Review title</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={100}
                    placeholder="Summarise your experience…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 placeholder-gray-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Review *</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    maxLength={1000}
                    rows={4}
                    required
                    placeholder="What did you love (or not)? Help other customers decide…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 placeholder-gray-400 resize-none transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{reviewForm.comment.length}/1000</p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 sm:flex-none sm:px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmittingReview ? (
                      <><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Submitting…</>
                    ) : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-2xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rating summary + reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Star className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
              {/* Rating summary sidebar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
                <div className="text-center mb-5 pb-5 border-b border-gray-100">
                  <p className="text-6xl font-bold text-navy-900 leading-none">{product.ratings.average}</p>
                  <div className="flex justify-center gap-0.5 mt-3 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-5 w-5", i < Math.round(product.ratings.average) ? "fill-gold-400 text-gold-400" : "fill-gray-200 text-gray-200")} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</p>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const found = ratingDistribution.find((d) => d._id === star);
                    return <RatingBar key={star} label={String(star)} count={found?.count || 0} total={totalReviews} />;
                  })}
                </div>
              </div>

              {/* Review cards */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                    {/* Reviewer header */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-600 to-navy-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-bold text-sm">{review.user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {review.isVerifiedPurchase && (
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-0.5">
                                <Check className="h-3 w-3" /> Verified
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {/* Stars */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-gold-400 text-gold-400" : "fill-gray-200 text-gray-200")} />
                        ))}
                      </div>
                    </div>

                    {review.title && <h4 className="font-semibold text-gray-900 mb-1.5 text-[15px]">{review.title}</h4>}
                    <p className="text-sm text-gray-700 leading-relaxed break-words">{review.comment}</p>

                    {/* Review images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {review.images.map((img, i) => (
                          <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                            <Image src={img.url} alt={`Review image ${i + 1}`} fill className="object-cover" sizes="64px" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Helpful vote */}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                      <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 transition-colors">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Helpful {review.helpfulVotes.length > 0 && `(${review.helpfulVotes.length})`}
                      </button>
                    </div>

                    {/* Admin reply */}
                    {review.adminReply?.text && (
                      <div className="mt-4 ml-4 pl-4 border-l-2 border-brand-200 bg-brand-50/40 rounded-r-xl py-3 pr-3">
                        <p className="text-xs font-bold text-brand-700 mb-1 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Response from The House of Rani
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.adminReply.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(review.adminReply.createdAt)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ MOBILE STICKY CTA (sits above app bottom nav) ══════════════ */}
      <div
        className="sm:hidden fixed left-0 right-0 z-[85] bg-white border-t border-gray-200 px-4 pt-3 pb-3 shadow-[0_-8px_30px_-6px_rgba(0,0,0,0.12)] backdrop-blur-md"
        style={{
          bottom: "calc(3.35rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {isOutOfStock ? (
          <div className="w-full py-3.5 rounded-2xl bg-gray-200 text-gray-400 text-sm font-bold text-center">Out of Stock</div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 py-3.5 rounded-2xl border-2 border-navy-900 text-navy-900 text-sm font-bold flex items-center justify-center gap-2 hover:bg-navy-900 hover:text-white transition-all disabled:opacity-60"
            >
              {isAddingToCart ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              {isAddingToCart ? "Adding…" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isBuyingNow}
              className="flex-1 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-200 disabled:opacity-60"
            >
              {isBuyingNow ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Zap className="h-4 w-4" />}
              {isBuyingNow ? "Processing…" : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
