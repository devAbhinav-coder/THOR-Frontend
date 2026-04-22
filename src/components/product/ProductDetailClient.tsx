"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  ChevronRight,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  Zap,
  Package,
  MapPin,
  Check,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Gift,
} from "lucide-react";
import { cartApi, productApi, reviewApi } from "@/lib/api";
import { Product, Review, ProductVariant } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { variantSwatchBackground } from "@/lib/variantSwatch";
import { sumVariantStock } from "@/lib/productStock";
import { ProductDetailSkeleton } from "@/components/product/ProductDetailSkeleton";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import GiftCustomizationModal from "@/components/gifting/GiftCustomizationModal";
import RichTextContent from "@/components/ui/RichTextContent";
import { isLowInStockVariant } from "@/lib/inventoryConstants";
import { normalizeProductImages } from "@/lib/cloudinaryUrl";
import { productNeedsCustomization } from "@/lib/productCustomization";
import {
  type ReviewEligibility,
  type ReviewFormState,
  PdpImageGallery,
  PdpReviewsSection,
  PdpRelatedProductRows,
} from "@/components/product/pdp";
import { playCheckoutLaunchAnimation } from "@/lib/checkoutLaunchFx";
import shoppingCartGif from "@/assets/shopping-cart.gif";

const BUY_NOW_SESSION_KEY = "hor_buy_now_checkout_item";
const MAX_REVIEW_IMAGES = 3;
const MAX_REVIEW_IMAGE_SIZE_MB = 5;
const MAX_REVIEW_IMAGE_SIZE_BYTES = MAX_REVIEW_IMAGE_SIZE_MB * 1024 * 1024;
const REVIEW_IMAGE_MAX_DIMENSION = 1600;
type RatingDistributionBucket = { _id: number | string; count: number };

async function compressReviewImageToWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image."));
      img.src = objectUrl;
    });

    const maxSide = Math.max(image.naturalWidth, image.naturalHeight, 1);
    const initialScale =
      maxSide > REVIEW_IMAGE_MAX_DIMENSION ?
        REVIEW_IMAGE_MAX_DIMENSION / maxSide
      : 1;
    let width = Math.max(1, Math.round(image.naturalWidth * initialScale));
    let height = Math.max(1, Math.round(image.naturalHeight * initialScale));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Your browser does not support image processing.");

    const qualities = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48];
    let smallestBlob: Blob | null = null;

    for (let shrink = 0; shrink < 4; shrink += 1) {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
        if (!blob) continue;
        if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;
        if (blob.size <= MAX_REVIEW_IMAGE_SIZE_BYTES) {
          return new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, "") || "review-image"}.webp`,
            {
              type: "image/webp",
              lastModified: Date.now(),
            },
          );
        }
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }

    if (smallestBlob && smallestBlob.size <= MAX_REVIEW_IMAGE_SIZE_BYTES) {
      return new File(
        [smallestBlob],
        `${file.name.replace(/\.[^.]+$/, "") || "review-image"}.webp`,
        {
          type: "image/webp",
          lastModified: Date.now(),
        },
      );
    }
    throw new Error(`Each image must be under ${MAX_REVIEW_IMAGE_SIZE_MB}MB.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface Props {
  slug: string;
  /** Server-rendered product — skips full-page skeleton while reviews/related load. */
  initialProduct?: Product | null;
}

function canHydrateFromInitial(
  slug: string,
  initialProduct: Product | null | undefined,
): initialProduct is Product {
  return (
    !!initialProduct &&
    String(initialProduct.slug).toLowerCase() === String(slug).toLowerCase()
  );
}

export default function ProductDetailClient({ slug, initialProduct }: Props) {
  /* Core — initialize from SSR product so first paint is not a duplicate skeleton after loading.tsx */
  const [product, setProduct] = useState<Product | null>(() => {
    if (!canHydrateFromInitial(slug, initialProduct)) return null;
    return {
      ...initialProduct,
      images: normalizeProductImages(initialProduct.images),
    };
  });
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => {
      if (!canHydrateFromInitial(slug, initialProduct)) return null;
      const variants = initialProduct.variants || [];
      return variants.find((v) => v.stock > 0) || variants[0] || null;
    },
  );
  const [isLoading, setIsLoading] = useState(
    () => !canHydrateFromInitial(slug, initialProduct),
  );

  /* Variant / Qty */
  const [quantity, setQuantity] = useState(1);

  /* Actions */
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const buyNowBtnRef = useRef<HTMLButtonElement>(null);
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
    RatingDistributionBucket[]
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
  const reviewEligibilityRequestKeyRef = useRef<string | null>(null);

  const needsCustomization = useMemo(
    () => (product ? productNeedsCustomization(product) : false),
    [product],
  );

  const isGiftMarketingContext = useMemo(
    () =>
      !!product?.isGiftable ||
      product?.category?.toLowerCase() === "gifting" ||
      needsCustomization,
    [product, needsCustomization],
  );

  /* Initial fetch */
  useEffect(() => {
    const hydratedFromServer =
      initialProduct &&
      String(initialProduct.slug).toLowerCase() === String(slug).toLowerCase();
    if (!hydratedFromServer) {
      setIsLoading(true);
    }
    setReviews([]);
    setRelatedProducts([]);
    setMoreProducts([]);
    setReviewEligibility(null);
    setShowReviewForm(false);

    const fetchAll = async () => {
      try {
        let p: Product | null = null;
        if (hydratedFromServer && initialProduct) {
          p = {
            ...initialProduct,
            images: normalizeProductImages(initialProduct.images),
          };
          setProduct(p);
          const variants = p.variants || [];
          setSelectedVariant(variants.find((v) => v.stock > 0) || variants[0]);
          setIsLoading(false);
        }

        try {
          const main = await productApi.getBySlug(slug);
          p = main.data.product as Product;
          setProduct({
            ...p,
            images: normalizeProductImages(p.images),
          });
          const variants = p.variants || [];
          setSelectedVariant(
            (prev) =>
              variants.find((v) => v.sku === prev?.sku) ||
              variants.find((v) => v.stock > 0) ||
              variants[0],
          );
        } catch {
          if (!p) throw new Error("Failed to fetch product");
        }
        if (!p) throw new Error("Product unavailable");

        let bestRelated: Product[] = [];
        const [reviewsRes, relatedRes, moreRes] = await Promise.allSettled([
          reviewApi.getProductReviews(p._id),
          productApi.getByCategory(p.category, { limit: 40 }),
          productApi.getAll({ limit: 48, sort: "-createdAt" }),
        ]);

        if (reviewsRes.status === "fulfilled") {
          const rv = reviewsRes.value;
          const rvData = rv.data as {
            reviews?: Review[];
            ratingDistribution?: RatingDistributionBucket[];
          };
          setReviews(rv.data.reviews || []);
          setRatingDistribution(
            rv.ratingDistribution || rvData.ratingDistribution || [],
          );
          setReviewsPagination(rv.pagination || { totalPages: 1, total: 0 });
        }
        const isGiftBaseProduct =
          p.isGiftable ||
          p.category?.toLowerCase() === "gifting" ||
          productNeedsCustomization(p);

        if (relatedRes.status === "fulfilled") {
          const all: Product[] = relatedRes.value.data?.products || [];
          const scoped =
            isGiftBaseProduct ?
              all.filter(
                (r) =>
                  r.isGiftable ||
                  r.category?.toLowerCase() === "gifting" ||
                  productNeedsCustomization(r),
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
                p.category?.toLowerCase() === "gifting" ||
                productNeedsCustomization(p);

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

                if (
                  productNeedsCustomization(p) === productNeedsCustomization(r)
                )
                  score += 40;

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

          bestRelated = scored.map((r) => ({
            ...r,
            images: normalizeProductImages(r.images),
          }));
          setRelatedProducts(bestRelated);
        }
        if (moreRes.status === "fulfilled") {
          const all: Product[] = moreRes.value.data?.products || [];
          const scoped =
            isGiftBaseProduct ?
              all.filter(
                (r) =>
                  r.isGiftable ||
                  r.category?.toLowerCase() === "gifting" ||
                  productNeedsCustomization(r),
              )
            : all.filter(
                (r) => !r.isGiftable && r.category?.toLowerCase() !== "gifting",
              );
          const exclude = new Set<string>([
            p._id,
            ...bestRelated.map((x) => x._id),
          ]);
          setMoreProducts(
            scoped
              .filter((r) => !exclude.has(r._id))
              .slice(0, 8)
              .map((r) => ({
                ...r,
                images: normalizeProductImages(r.images),
              })),
          );
        }
      } catch {
        /* not found */
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [slug, initialProduct]);

  /* Review eligibility (only when authenticated & product loaded) */
  useEffect(() => {
    const productId = product?._id;
    if (!isAuthenticated || !productId) {
      reviewEligibilityRequestKeyRef.current = null;
      return;
    }
    const requestKey = `${productId}:authed`;
    if (reviewEligibilityRequestKeyRef.current === requestKey) return;
    reviewEligibilityRequestKeyRef.current = requestKey;
    let cancelled = false;
    reviewApi
      .canReview(productId)
      .then((body) =>
        !cancelled &&
        setReviewEligibility({
          canReview: body.data.canReview,
          hasPurchased: body.data.hasPurchased ?? false,
          hasReviewed: body.data.hasReviewed ?? false,
          orderId: body.data.orderId ? String(body.data.orderId) : null,
        }),
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, product?._id]);

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
  const totalReviews = useMemo(() => {
    const fromPagination = Number(reviewsPagination.total || 0);
    return fromPagination > 0 ? fromPagination : reviews.length;
  }, [reviewsPagination.total, reviews.length]);
  const displayAverageRating = useMemo(() => {
    const fromProduct = Number(product?.ratings?.average || 0);
    if (fromProduct > 0) return fromProduct;
    if (reviews.length === 0) return 0;
    return Number(
      (
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      ).toFixed(1),
    );
  }, [product?.ratings?.average, reviews]);
  const displayReviewCount = useMemo(() => {
    const fromProduct = Number(product?.ratings?.count || 0);
    if (fromProduct > 0) return fromProduct;
    return totalReviews;
  }, [product?.ratings?.count, totalReviews]);
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
          Browse all sarees
        </Link>
      </div>
    );
  }
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
          colorCode: selectedVariant.colorCode,
        },
        quantity,
        answersArray.length > 0 ? answersArray : undefined,
        product,
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          BUY_NOW_SESSION_KEY,
          JSON.stringify({
            productId: product._id,
            name: product.name,
            image: product.images?.[0]?.url || "",
            quantity,
            price: selectedPrice,
            maxStock: selectedVariant.stock,
            variant: {
              sku: selectedVariant.sku,
              size: selectedVariant.size,
              color: selectedVariant.color,
              colorCode: selectedVariant.colorCode,
            },
            customFieldAnswers:
              answersArray.length > 0 ? answersArray : undefined,
          }),
        );
      }
      await playCheckoutLaunchAnimation(buyNowBtnRef.current, {
        gifSrc: shoppingCartGif.src,
      });
      router.push("/checkout?buyNow=1");
    } catch {
      setIsBuyingNow(false);
      toast.error("Could not start checkout. Try again.");
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) return requireAuth("Sign in to save to wishlist");
    await toggleWishlist(product._id, product);
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

  const handleReviewImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewImages.length > MAX_REVIEW_IMAGES) {
      toast.error(`You can only upload up to ${MAX_REVIEW_IMAGES} images`);
      e.target.value = "";
      return;
    }
    try {
      const converted = await Promise.all(
        files.map((file) => compressReviewImageToWebp(file)),
      );
      const newFiles = [...reviewImages, ...converted].slice(
        0,
        MAX_REVIEW_IMAGES,
      );
      setReviewImages(newFiles);

      reviewPreviews.forEach((url) => URL.revokeObjectURL(url));
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setReviewPreviews(newPreviews);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          `Each review image must be under ${MAX_REVIEW_IMAGE_SIZE_MB}MB`,
      );
    } finally {
      e.target.value = "";
    }
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
      const submittedRating = Math.max(
        1,
        Math.min(5, Number(newReview.rating || reviewForm.rating || 0)),
      );

      setReviews((prev) => [newReview, ...prev]);
      setReviewsPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      setRatingDistribution((prev) => {
        const next = [...prev];
        const idx = next.findIndex((d) => Number(d._id) === submittedRating);
        if (idx >= 0) {
          next[idx] = { ...next[idx], count: Number(next[idx].count || 0) + 1 };
        } else {
          next.push({ _id: submittedRating, count: 1 });
        }
        return next;
      });
      setProduct((prev) => {
        if (!prev) return prev;
        const prevCount = Number(prev.ratings?.count || 0);
        const prevAvg = Number(prev.ratings?.average || 0);
        const nextCount = prevCount + 1;
        const nextAvg =
          nextCount > 0 ?
            Number(
              ((prevAvg * prevCount + submittedRating) / nextCount).toFixed(1),
            )
          : submittedRating;
        return {
          ...prev,
          ratings: {
            average: nextAvg,
            count: nextCount,
          },
        };
      });
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
    "pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6";

  return (
    <div
      className={cn(
        "bg-white min-h-screen max-w-full overflow-x-hidden",
        mobileBottomReserve,
      )}
    >
      {/* Breadcrumb */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-1'>
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
          {isGiftMarketingContext && product.giftOccasions?.[0] && (
            <>
              <ChevronRight className='h-3 w-3' />
              <Link
                href='/gift'
                className='hover:text-brand-600 transition-colors'
              >
                {product.giftOccasions?.[0]}
              </Link>
            </>
          )}
          <ChevronRight className='h-3 w-3' />
          <span className='text-gray-600 font-medium truncate max-w-[180px]'>
            {product.name}
          </span>
        </nav>
      </div>

      {/* HERO - Gallery + Info */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-6 min-w-0'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 xl:gap-10 min-w-0'>
          <PdpImageGallery
            productId={product._id}
            name={product.name}
            images={product.images}
            isGiftMarketingContext={isGiftMarketingContext}
            isFeatured={product.isFeatured}
            isOutOfStock={isOutOfStock}
            inWishlist={inWishlist}
            copied={copied}
            onWishlist={handleWishlist}
            onShare={handleShare}
          />

          {/* Product Info */}
          <div className='min-w-0 space-y-4 sm:space-y-5'>
            {/* Category chips */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full'>
                {product.category}
              </span>
              {isGiftMarketingContext &&
                product.giftOccasions?.[0] &&
                //loop for all gift occasions
                product.giftOccasions.map((occasion) => (
                  <span
                    key={occasion}
                    className='text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full'
                  >
                    {occasion}
                  </span>
                ))}

              {isGiftMarketingContext && product.isCustomizable && (
                <span className='text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full'>
                  Customizable
                </span>
              )}

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

            {/* Rating + link to reviews (always visible so users find quality feedback) */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-x-3 sm:gap-y-2'>
              <div className='flex items-center gap-2.5 flex-wrap'>
                <div className='flex items-center gap-0.5' aria-hidden>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        (
                          displayReviewCount > 0 &&
                            i < Math.round(displayAverageRating)
                        ) ?
                          "fill-gold-400 text-gold-400"
                        : "fill-gray-200 text-gray-200",
                      )}
                    />
                  ))}
                </div>
                {displayReviewCount > 0 ?
                  <>
                    <span className='text-sm font-semibold text-gray-800'>
                      {displayAverageRating.toFixed(1)}
                    </span>
                    <a
                      href='#reviews-section'
                      className='text-sm text-gray-500 hover:text-brand-600 transition-colors underline-offset-2 hover:underline'
                    >
                      {displayReviewCount}{" "}
                      {displayReviewCount === 1 ? "review" : "reviews"}
                    </a>
                  </>
                : <span className='text-sm text-gray-500'>
                    No reviews yet — be the first
                  </span>
                }
              </div>
              {isAuthenticated && reviewEligibility?.canReview && (
                <button
                  type='button'
                  onClick={() => {
                    document
                      .getElementById("reviews-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setTimeout(() => setShowReviewForm(true), 400);
                  }}
                  className='inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-left text-sm font-bold text-brand-800 shadow-sm transition hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40'
                >
                  <MessageSquare className='h-4 w-4 shrink-0' />
                  <span>
                    Rate quality and share your experience — you bought this
                  </span>
                </button>
              )}
            </div>

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
                Inclusive of all taxes - Free delivery above Rs. 1099
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
                    const swatch = variantSwatchBackground(
                      color,
                      (v as ProductVariant & { colorCode?: string })?.colorCode,
                    );
                    return (
                      <button
                        key={color}
                        onClick={() => v && setSelectedVariant(v)}
                        disabled={!ok}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-xl border-2 text-sm font-medium transition-all",
                          selectedVariant?.color === color ?
                            "border-transparent  shadow-md ring-2 ring-brand-100"
                          : ok ?
                            "border-gray-200 text-gray-700 hover:border-brand-400 hover:bg-brand-50"
                          : "border-gray-100 text-gray-300 cursor-not-allowed",
                        )}
                        style={{ backgroundColor: "white", color: "black" }}
                      >
                        {swatch && (
                          <span
                            className={cn(
                              "h-6 w-6 rounded-full shadow-inner",
                              selectedVariant?.color === color ?
                                "border border-white/80"
                              : "border border-white/50",
                            )}
                            style={{
                              background: swatch,
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
                  : isLowInStockVariant(selectedVariant.stock) ?
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
                  ref={buyNowBtnRef}
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

              {/* Quote CTA — only when catalog marks the product customizable (not merely customFields) */}
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
                { icon: Truck, label: "Free Delivery", sub: "Above Rs. 1099" },
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
                Free shipping on orders above Rs. 1099.
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
                <RichTextContent
                  text={product.description}
                  className='space-y-4'
                />
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

      <PdpReviewsSection
        product={product}
        isAuthenticated={isAuthenticated}
        totalReviews={totalReviews}
        previewReviewCount={previewReviewCount}
        visibleReviews={visibleReviews}
        reviews={reviews}
        ratingDistribution={ratingDistribution}
        positiveReviewsPercent={positiveReviewsPercent}
        reviewEligibility={reviewEligibility}
        showReviewForm={showReviewForm}
        setShowReviewForm={setShowReviewForm}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        reviewImages={reviewImages}
        reviewPreviews={reviewPreviews}
        onReviewImageChange={handleReviewImageChange}
        onRemoveReviewImage={removeReviewImage}
        isSubmittingReview={isSubmittingReview}
        onSubmitReview={handleSubmitReview}
        expandedReviewPhotos={expandedReviewPhotos}
        setExpandedReviewPhotos={setExpandedReviewPhotos}
        reviewLightbox={reviewLightbox}
        setReviewLightbox={setReviewLightbox}
        showAllReviewsModal={showAllReviewsModal}
        setShowAllReviewsModal={setShowAllReviewsModal}
        isVotingHelpful={isVotingHelpful}
        onHelpfulVote={handleHelpfulVote}
        onOpenReportReview={openReportReview}
        reportTarget={reportTarget}
        setReportTarget={setReportTarget}
        reportingReviewId={reportingReviewId}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDetails={reportDetails}
        setReportDetails={setReportDetails}
        onSubmitReport={handleReportReview}
      />

      <PdpRelatedProductRows
        product={product}
        isGiftMarketingContext={isGiftMarketingContext}
        relatedProducts={relatedProducts}
        moreProducts={moreProducts}
      />

      {isGiftModalOpen && product && (
        <GiftCustomizationModal
          product={product}
          onClose={() => setIsGiftModalOpen(false)}
        />
      )}
    </div>
  );
}
