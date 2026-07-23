"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Star,
  ImagePlus,
  X,
  CheckCircle2,
  UserRound,
  EyeOff,
  Package,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { productApi, reviewApi, testimonialApi } from "@/lib/api";
import { UPLOAD_MAX_MB, uploadMaxBytes } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_PHOTOS = 5;
const MAX_MB = UPLOAD_MAX_MB.review;
const MAX_BYTES = uploadMaxBytes(MAX_MB);
const COMPRESS_IF_OVER = 6 * 1024 * 1024;

type LockedProduct = {
  _id: string;
  name: string;
  slug?: string;
  images?: { url: string }[];
};

async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > MAX_BYTES) throw new Error(`Each photo must be under ${MAX_MB}MB`);
  if (file.size <= COMPRESS_IF_OVER) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = objectUrl;
    });
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.78, 0.68, 0.58]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= MAX_BYTES) {
        return new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "") || "photo"}.webp`,
          { type: "image/webp" },
        );
      }
    }
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Customer form — admin decides the mode via the link:
 * - /share-your-story → homepage story only
 * - /share-your-story?productId=… → locked product review + story (both)
 * No free product picker / mode tabs for customers.
 */
function ShareYourStoryForm() {
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("productId") || "";
  const productSlugParam = searchParams.get("product") || "";

  const [product, setProduct] = useState<LockedProduct | null>(null);
  const [productLoading, setProductLoading] = useState(Boolean(productIdParam || productSlugParam));
  const [productError, setProductError] = useState<string | null>(null);

  const isProductReview = Boolean(product);

  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const key = productIdParam || productSlugParam;
    if (!key) {
      setProduct(null);
      setProductLoading(false);
      return;
    }
    let cancelled = false;
    setProductLoading(true);
    setProductError(null);

    const load = async () => {
      try {
        const key = productIdParam || productSlugParam;
        const res = await productApi.getBySlug(key);
        const p = res.data?.product as LockedProduct | undefined;
        if (!cancelled && p?._id) setProduct(p);
        else if (!cancelled) setProductError("This product link is invalid.");
      } catch {
        if (!cancelled) setProductError("Could not load this product link.");
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [productIdParam, productSlugParam]);

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    e.target.value = "";
    if (!incoming.length) return;
    if (files.length + incoming.length > MAX_PHOTOS) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    setPreparing(true);
    try {
      const prepared: File[] = [];
      for (const file of incoming) prepared.push(await preparePhoto(file));
      const next = [...files, ...prepared];
      setFiles(next);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Could not add photo");
    } finally {
      setPreparing(false);
    }
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, j) => j !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, j) => j !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote.trim().length < 10) {
      toast.error("Please write a bit more (at least 10 characters)");
      return;
    }
    if (files.length < 1) {
      toast.error("Please upload at least one photo");
      return;
    }
    if ((productIdParam || productSlugParam) && !product) {
      toast.error("Product link is invalid");
      return;
    }

    setSaving(true);
    try {
      const anonymous = isAnonymous || !displayName.trim();
      if (isProductReview && product) {
        const fd = new FormData();
        fd.append("productId", product._id);
        fd.append("comment", quote.trim());
        fd.append("rating", String(rating));
        fd.append("isAnonymous", String(anonymous));
        fd.append("displayName", anonymous ? "" : displayName.trim());
        fd.append("alsoAsStory", "true");
        files.forEach((f) => fd.append("images", f));
        await reviewApi.submitPublic(fd);
      } else {
        const fd = new FormData();
        fd.append("quote", quote.trim());
        fd.append("rating", String(rating));
        fd.append("isAnonymous", String(anonymous));
        fd.append("displayName", anonymous ? "" : displayName.trim());
        files.forEach((f) => fd.append("images", f));
        await testimonialApi.submitPublic(fd);
      }
      setDone(true);
      toast.success("Thank you! Submitted for review.");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Could not submit. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const heading = useMemo(() => {
    if (isProductReview) return "Review your piece";
    return "Share your story";
  }, [isProductReview]);

  if (productLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  if ((productIdParam || productSlugParam) && (productError || !product)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#faf8f5]">
        <div className="max-w-md w-full text-center rounded-2xl bg-white border border-navy-900/8 p-8">
          <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
          <h1 className="mt-4 font-serif text-2xl text-navy-900">Link unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{productError || "Invalid product link."}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#faf8f5]">
        <div className="max-w-md w-full text-center rounded-2xl bg-white border border-navy-900/8 p-8 shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 font-serif text-2xl font-medium text-navy-900">Thank you</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {isProductReview
              ? "Your review and story were received. We'll approve them before they go live."
              : "Your story was received. We'll approve it before it goes live."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#faf8f5] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059]">
            The House of Rani
          </p>
          <h1 className="mt-3 text-center font-serif text-3xl font-medium text-navy-900 sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed">
            Thank you for sharing. Add your words and a photo — we approve before anything goes live.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-navy-900/8 bg-white p-5 sm:p-7 shadow-sm space-y-6"
        >
          {product ? (
            <div className="flex items-center gap-3 rounded-xl border border-navy-900/10 bg-navy-50/40 px-3 py-2.5">
              {product.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover bg-white"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white">
                  <Package className="h-5 w-5 text-gray-300" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Reviewing
                </p>
                <p className="text-sm font-medium text-navy-900 truncate">{product.name}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">How you appear</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAnonymous(false)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition",
                  !isAnonymous
                    ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-700",
                )}
              >
                <UserRound className="h-4 w-4" />
                <span className="text-sm font-semibold">Show my name</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAnonymous(true);
                  setDisplayName("");
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition",
                  isAnonymous
                    ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-700",
                )}
              >
                <EyeOff className="h-4 w-4" />
                <span className="text-sm font-semibold">Stay anonymous</span>
              </button>
            </div>
            {!isAnonymous && (
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/10"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ananya M."
                maxLength={80}
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Your experience *
            </label>
            <textarea
              className="mt-1 w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder={
                isProductReview
                  ? "How was this piece — fit, fabric, occasion?"
                  : "How did you feel wearing / gifting House of Rani?"
              }
              maxLength={1000}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rating</label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star
                    className={cn(
                      "h-7 w-7",
                      n <= rating ? "fill-[#c5a059] text-[#c5a059]" : "fill-gray-200 text-gray-200",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Photos * · at least 1 · up to {MAX_PHOTOS}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {previews.map((url, i) => (
                <div key={url} className="relative h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    onClick={() => removePhoto(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length < MAX_PHOTOS && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{preparing ? "…" : "Add"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={preparing || saving}
                    onChange={onPickFiles}
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="brand"
            className="w-full"
            disabled={saving || preparing || files.length < 1}
          >
            {saving
              ? "Sending…"
              : isProductReview
                ? "Submit review & story"
                : "Submit my story"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ShareYourStoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">
          Loading…
        </div>
      }
    >
      <ShareYourStoryForm />
    </Suspense>
  );
}
