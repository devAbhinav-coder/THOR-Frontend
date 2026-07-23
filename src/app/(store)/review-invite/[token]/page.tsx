"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { reviewInviteApi } from "@/lib/api";
import { UPLOAD_MAX_MB, uploadMaxBytes } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_PHOTOS = 5;
const MAX_MB = UPLOAD_MAX_MB.review;
const MAX_BYTES = uploadMaxBytes(MAX_MB);
const COMPRESS_IF_OVER = 6 * 1024 * 1024;

type InviteItem = {
  productId: string;
  name: string;
  slug?: string;
  image?: string | null;
  alreadyReviewed: boolean;
};

type InvitePayload = {
  orderNumber: string;
  customerFirstName: string;
  expiresAt: string;
  items: InviteItem[];
  remainingCount: number;
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
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, width, height);
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

function ReviewInviteForm() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reviewInviteApi.get(token);
      const data = res.data as InvitePayload;
      setInvite(data);
      const firstOpen = (data.items || []).find((i) => !i.alreadyReviewed);
      setSelectedId(firstOpen?.productId || null);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "This link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = invite?.items.find((i) => i.productId === selectedId) || null;
  const openItems = (invite?.items || []).filter((i) => !i.alreadyReviewed);

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
    if (!selected || selected.alreadyReviewed) {
      toast.error("Please choose a product to review");
      return;
    }
    if (quote.trim().length < 10) {
      toast.error("Please write a bit more (at least 10 characters)");
      return;
    }
    if (files.length < 1) {
      toast.error("Please add at least one photo");
      return;
    }
    setSaving(true);
    try {
      const anonymous = isAnonymous || !displayName.trim();
      const fd = new FormData();
      fd.append("productId", selected.productId);
      fd.append("comment", quote.trim());
      fd.append("rating", String(rating));
      fd.append("isAnonymous", String(anonymous));
      fd.append("displayName", anonymous ? "" : displayName.trim());
      files.forEach((f) => fd.append("images", f));
      const res = await reviewInviteApi.submit(token, fd);
      const remaining = Number((res.data as { remainingCount?: number })?.remainingCount ?? 0);
      toast.success("Thank you — submitted for approval");
      if (remaining > 0) {
        setQuote("");
        setFiles([]);
        setPreviews([]);
        setRating(5);
        await load();
      } else {
        setDone(true);
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Could not submit");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">
        Opening your secure link…
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#faf8f5]">
        <div className="max-w-md w-full text-center rounded-2xl bg-white border border-navy-900/8 p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
          <h1 className="mt-4 font-serif text-2xl text-navy-900">Link unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (done || openItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#faf8f5]">
        <div className="max-w-md w-full text-center rounded-2xl bg-white border border-navy-900/8 p-8 shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 font-serif text-2xl font-medium text-navy-900">Thank you</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Your review and story were received. We'll approve them before they go live.
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
          <h1 className="mt-3 font-serif text-3xl font-medium text-navy-900 sm:text-4xl">
            Share your experience
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Thank you, {invite.customerFirstName}. For order{" "}
            <span className="font-medium text-navy-900">{invite.orderNumber}</span> — add your words
            and a photo. We approve before anything goes live.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-navy-900/8 bg-white p-5 sm:p-7 shadow-sm space-y-6"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Product from your purchase *
            </p>
            <div className="space-y-2">
              {invite.items.map((item) => (
                <button
                  key={item.productId}
                  type="button"
                  disabled={item.alreadyReviewed}
                  onClick={() => setSelectedId(item.productId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    item.alreadyReviewed && "opacity-50 cursor-not-allowed bg-gray-50",
                    !item.alreadyReviewed && selectedId === item.productId
                      ? "border-navy-900 bg-navy-50/60 ring-1 ring-navy-900/10"
                      : !item.alreadyReviewed && "border-gray-200 hover:border-gray-300",
                  )}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {item.alreadyReviewed ? "Already submitted" : "Tap to select"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">How you appear</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAnonymous(false)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition",
                  !isAnonymous
                    ? "border-navy-900 bg-navy-900 text-white"
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
                    ? "border-navy-900 bg-navy-900 text-white"
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
              placeholder="How did you feel wearing / gifting this piece?"
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
            disabled={saving || preparing || files.length < 1 || !selected}
          >
            {saving ? "Sending…" : "Submit review & story"}
          </Button>
          <p className="text-center text-[11px] text-gray-400">
            Verified for this purchase · Goes live after House of Rani approval
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ReviewInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">
          Loading…
        </div>
      }
    >
      <ReviewInviteForm />
    </Suspense>
  );
}
