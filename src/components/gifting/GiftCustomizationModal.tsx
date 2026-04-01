"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Gift, Loader2, CheckCircle2, ShoppingBag, Zap, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, giftingApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import ImageUploader from "@/components/ui/ImageUploader";
import Link from "next/link";
import type { Product as ProductType } from "@/types";

interface CustomField {
  _id: string;
  label: string;
  placeholder?: string;
  fieldType: "text" | "textarea" | "select" | "image";
  options?: string[];
  isRequired: boolean;
}

type Product = Pick<
  ProductType,
  "_id" | "name" | "price" | "category" | "isCustomizable" | "variants"
> & {
  minOrderQty?: number;
  customFields?: CustomField[];
  giftOccasions?: string[];
};

interface Props {
  product: Product;
  onClose: () => void;
}

const PACKAGING_OPTIONS: Array<{
  id: "standard" | "premium" | "custom";
  label: string;
  desc: string;
  emoji: string;
}> = [
  { id: "standard", label: "Standard", desc: "Clean, simple wrap", emoji: "📦" },
  { id: "premium", label: "Premium", desc: "Ribbon & box", emoji: "🎁" },
  { id: "custom", label: "Custom", desc: "Special requests", emoji: "🎨" },
];

export default function GiftCustomizationModal({ product, onClose }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"form" | "success">("form");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const minOrderQty = product.minOrderQty ?? 1;
  const customFields = product.customFields ?? [];

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(minOrderQty);
  const [occasion, setOccasion] = useState(product.giftOccasions?.[0] || "");
  const [customOccasion, setCustomOccasion] = useState("");
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string>>({});
  const [uploadingFieldImages, setUploadingFieldImages] = useState<Record<string, boolean>>({});
  const [recipientMessage, setRecipientMessage] = useState("");
  const [customizationNote, setCustomizationNote] = useState("");
  const [packaging, setPackaging] = useState<"standard" | "premium" | "custom">("standard");
  const [customPackagingNote, setCustomPackagingNote] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [proposedPrice, setProposedPrice] = useState<string>("");

  const mutation = useMutation({
    mutationFn: (fd: FormData) => giftingApi.submitRequest(fd),
    onSuccess: () => {
      // Invalidate so /dashboard/gifting shows the new request immediately
      queryClient.invalidateQueries({ queryKey: ["my-gifting-requests"] });
      setStep("success");
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to submit request. Please try again.",
      ),
  });

  const handleCustomFieldImageUpload = async (fieldId: string, file?: File) => {
    if (!file) return;
    setUploadingFieldImages((prev) => ({ ...prev, [fieldId]: true }));
    try {
      const fd = new FormData();
      fd.append("images", file);
      const res = await cartApi.uploadCustomFieldImage(fd);
      const imageUrl = (res.data as { image?: { url?: string } })?.image?.url;
      if (!imageUrl) throw new Error("Upload failed");
      setFieldAnswers((prev) => ({ ...prev, [fieldId]: imageUrl }));
      toast.success("Image attached");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Image upload failed");
    } finally {
      setUploadingFieldImages((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Gate: user must be logged in to submit a custom request
    if (product.isCustomizable && !isAuthenticated) {
      toast.error("Please log in to submit a custom gift request.");
      onClose();
      router.push(`/auth/login?redirect=/gifting`);
      return;
    }

    if (!name.trim() || !email.trim()) return toast.error("Name and email are required");
    
    // 10-unit Corporate minimum
    if (occasion === "Corporate" && quantity < 10) {
      return toast.error("Corporate gifting requires a minimum of 10 units.");
    }

    // Min order qty from product
    if (quantity < minOrderQty) {
      return toast.error(`Minimum quantity for this item is ${minOrderQty}`);
    }
    
    // Validate custom fields
    const answers = customFields.map((f) => ({
      fieldId: f._id,
      label: f.label,
      value: fieldAnswers[f._id] || "",
    }));

    for (const f of customFields) {
      if (f.isRequired && !fieldAnswers[f._id]?.trim()) {
        return toast.error(`"${f.label}" is required`);
      }
    }

    // MODE 1: REQUEST QUOTE (if isCustomizable = true)
    if (product.isCustomizable) {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      if (phone) fd.append("phone", phone);
      fd.append("occasion", customOccasion || occasion || "General");
      fd.append("packagingPreference", packaging);
      if (packaging === "custom" && customPackagingNote) fd.append("customPackagingNote", customPackagingNote);
      fd.append("recipientMessage", recipientMessage);
      fd.append("customizationNote", customizationNote);
      if (proposedPrice) fd.append("proposedPrice", proposedPrice);
      
      const items = [
        {
          product: product._id,
          name: product.name,
          quantity,
          customFieldAnswers: answers,
        },
      ];
      fd.append("items", JSON.stringify(items));
  
      referenceFiles.forEach((file) => {
        fd.append("images", file);
      });
  
      mutation.mutate(fd);
      return;
    }

    // MODE 2: DIRECT ADD TO CART (Standard Gift with customization)
    setIsAddingToCart(true);
    try {
      const variant = product.variants.find((v) => v.stock > 0) || product.variants[0];
      await addToCart(
        product._id,
        {
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          colorCode: variant.colorCode,
        },
        quantity,
        answers.map((a) => ({ label: a.label, value: a.value })),
        product as ProductType,
      );
      onClose();
    } catch {
      // toast handled in store
    } finally {
      setIsAddingToCart(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg h-[90dvh] sm:h-auto sm:max-h-[95dvh] flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {step === "success" ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted! 🎁</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              We'll review your request and send you a quote within 24 hours via email and in-app notification.
            </p>
            <Link
              href="/dashboard/gifting"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Track My Request <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              onClick={onClose}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b bg-white dark:bg-neutral-900 z-10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gold-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                    {product.isCustomizable ? "Bespoke Request" : "Personalize Your Gift"}
                    {product.isCustomizable && <span className="text-[10px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Premium</span>}
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-[220px] font-medium">{product.name}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5" data-lenis-prevent>
              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Phone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                      placeholder="10-digit"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Occasion & Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Occasion</label>
                  <select
                    value={occasion}
                    onChange={(e) => { setOccasion(e.target.value); setCustomOccasion(""); }}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 bg-white"
                  >
                    <option value="">Select…</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Festive">Festive</option>
                    <option value="Seasonal">Seasonal</option>
                    <option value="Personal">Personal</option>
                    <option value="other">Other…</option>
                  </select>
                  {occasion === "other" && (
                    <input
                      value={customOccasion}
                      onChange={(e) => setCustomOccasion(e.target.value)}
                      placeholder="Specify occasion"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                    />
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    <label>Qty</label>
                    {minOrderQty > 1 && <span className="text-amber-600">(min {minOrderQty})</span>}
                  </label>
                  <input
                    type="number"
                    min={minOrderQty}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                  />
                </div>
              </div>

              {/* Proposed Price (Only for customizable) */}
              {product.isCustomizable && (
                <div className="bg-gradient-to-br from-gold-50/80 to-amber-50/50 p-5 rounded-3xl border-2 border-gold-100/50 shadow-inner">
                  <label className="text-xs text-gold-700 font-extrabold uppercase tracking-widest flex items-center gap-2 mb-2.5">
                    <Zap className="h-4 w-4 fill-gold-500" /> PROPOSED BUDGET (PER UNIT)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600 font-black text-xl">₹</span>
                    <input
                      type="number"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder={String(product.price)}
                      className="w-full rounded-2xl border-2 border-gold-200/50 bg-white/80 pl-9 pr-4 py-4 text-lg font-black text-navy-900 focus:outline-none focus:ring-4 focus:ring-gold-400/20 focus:border-gold-400 transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <p className="text-[10px] text-amber-600/70 mt-2.5 font-semibold text-center leading-relaxed">
                    Suggest a rate you&apos;re comfortable with; we&apos;ll do our best to match your budget.
                  </p>
                </div>
              )}

              {/* Admin-defined Custom Fields */}
              {customFields.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personalization</p>
                  {customFields.map((field) => (
                    <div key={field._id}>
                      <label className="text-xs text-gray-600 font-medium">
                        {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {field.fieldType === "textarea" ? (
                        <textarea
                          value={fieldAnswers[field._id] || ""}
                          onChange={(e) => setFieldAnswers((p) => ({ ...p, [field._id]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={3}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 resize-none"
                        />
                      ) : field.fieldType === "select" ? (
                        <select
                          value={fieldAnswers[field._id] || ""}
                          onChange={(e) => setFieldAnswers((p) => ({ ...p, [field._id]: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 bg-white"
                        >
                          <option value="">Select…</option>
                          {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : field.fieldType === "image" ? (
                        <div className="space-y-2">
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                            {uploadingFieldImages[field._id] ? "Uploading..." : "Upload image"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={!!uploadingFieldImages[field._id]}
                              onChange={(e) =>
                                handleCustomFieldImageUpload(field._id, e.target.files?.[0])
                              }
                            />
                          </label>
                          {fieldAnswers[field._id] && (
                            <a
                              href={fieldAnswers[field._id]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-brand-600 underline"
                            >
                              Preview uploaded image
                            </a>
                          )}
                        </div>
                      ) : (
                        <input
                          value={fieldAnswers[field._id] || ""}
                          onChange={(e) => setFieldAnswers((p) => ({ ...p, [field._id]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message & Note */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gift Details</p>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Recipient Message (printed on card)</label>
                  <textarea
                    value={recipientMessage}
                    onChange={(e) => setRecipientMessage(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. Happy Anniversary! With love..."
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold uppercase tracking-wide mb-1.5 block">
                    {product.isCustomizable ? "Detailed Design Specifications" : "Additional Personalization Notes"}
                  </label>
                  <textarea
                    value={customizationNote}
                    onChange={(e) => setCustomizationNote(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={product.isCustomizable 
                      ? "Describe logo placement, specific colors, texture requirements, or any theme details..." 
                      : "Color preference, special requirements…" /* normal ellipsis */}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/20 resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>

              {/* Reference Images */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference Images (Optional)</p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200">
                  <ImageUploader
                    maxFiles={5}
                    maxSizeMB={5}
                    onChange={setReferenceFiles}
                    hint="Upload photos for reference/design"
                  />
                </div>
              </div>

              {/* Packaging */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Packaging</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {PACKAGING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPackaging(opt.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[85px]",
                        packaging === opt.id
                          ? "border-gold-400 bg-gold-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-1 mt-auto">{opt.emoji}</span>
                      <p className="text-xs font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {packaging === "custom" && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs text-brand-600 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Zap className="h-3 w-3" /> Describe Custom Packaging
                    </label>
                    <textarea
                      value={customPackagingNote}
                      onChange={(e) => setCustomPackagingNote(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="e.g. Include a handcrafted wooden box, specific wrap color, ribbon type..."
                      className="w-full rounded-xl border border-gold-200 bg-gold-50/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 resize-none font-medium text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 bg-white dark:bg-neutral-900 border-t shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10">
              <button
                type="submit"
                disabled={mutation.isPending || isAddingToCart}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl",
                  product.isCustomizable 
                    ? "bg-gold-500 hover:bg-gold-600 text-white shadow-gold-500/25" 
                    : "bg-navy-900 hover:bg-navy-800 text-white shadow-gray-400/20"
                )}
              >
                {mutation.isPending || isAddingToCart ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> {mutation.isPending ? "PROCESSING REQUEST..." : "ADDING TO CART..."}</>
                ) : (
                  <>{product.isCustomizable ? <><Gift className="h-5 w-5" /> SUBMIT BESPOKE REQUEST</> : <><ShoppingBag className="h-5 w-5" /> ADD TO BAG</>}</>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-2">
                Our team will contact you within 24 hours to confirm details.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
