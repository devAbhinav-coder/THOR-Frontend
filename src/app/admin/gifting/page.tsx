"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { adminApi, giftingApi, productApi } from "@/lib/api";
import {
  Gift, Plus, Pencil, Trash2, X, ChevronDown,
  Mail, Phone, Package, Loader2, Tag, MessageSquare,
  IndianRupee, Clock, User, CheckCircle2, XCircle,
  AlertCircle, Sparkles, Send, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatDate } from "@/lib/utils";
import ImageUploader from "@/components/ui/ImageUploader";
import toast from "react-hot-toast";
import type { Product } from "@/types";

// ─── Constants ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["new", "price_quoted", "approved_by_user", "rejected_by_user", "cancelled"] as const;
type Status = typeof STATUS_OPTIONS[number];

type StatusConfigItem = { label: string; color: string; icon: ComponentType<{ className?: string }> };
const STATUS_CONFIG: Record<Status, StatusConfigItem> = {
  new: { label: "New Request", color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
  price_quoted: { label: "Quote Sent", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Send },
  approved_by_user: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected_by_user: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle },
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all placeholder:text-gray-300";

type CustomField = {
  label: string;
  placeholder: string;
  fieldType: "text" | "textarea" | "select" | "image";
  options: string;
  isRequired: boolean;
};

type GiftCategory = { isGiftCategory?: boolean; giftType?: string; name?: string };
type GiftProduct = Product;
type GiftingAnswer = { label: string; value: string };
type GiftingItem = {
  name: string;
  quantity: number;
  product?: { images?: { url: string }[]; description?: string; price?: number };
  customFieldAnswers?: GiftingAnswer[];
};
type GiftingRequest = {
  _id: string;
  status: Status;
  name: string;
  email: string;
  phone?: string;
  occasion: string;
  recipientMessage?: string;
  customizationNote?: string;
  customPackagingNote?: string;
  quotedPrice?: number | null;
  proposedPrice?: number | null;
  deliveryTime?: string;
  adminNote?: string;
  packagingPreference?: "standard" | "premium" | "custom";
  linkedOrderId?: string;
  createdAt: string;
  items?: GiftingItem[];
  referenceImages?: { url: string }[];
};

// ─── Gift Product Form Modal ────────────────────────────────────────────────
function GiftProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: GiftProduct | null;
  onClose: () => void;
  onSave: (savedProduct?: GiftProduct) => void;
}) {
  const normalizeOccasion = (value: string) => String(value || "").trim().toLowerCase();
  const { data: categoriesRes } = useQuery({
    queryKey: ["admin-gift-categories-for-occasions"],
    queryFn: () => adminApi.getCategories({ active: false }),
    staleTime: 120_000,
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImageSlots, setExistingImageSlots] = useState<Product["images"]>(() =>
    product?.images?.length ? product.images.map((i) => ({ ...i })) : [],
  );
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || product?.shortDescription || "",
    price: String(product?.price || ""),
    comparePrice: String(product?.comparePrice || ""),
    minOrderQty: String(product?.minOrderQty || 1),
    giftOccasions: (product?.giftOccasions || []) as string[],
    isActive: product?.isActive !== undefined ? product.isActive : true,
    isCustomizable: product?.isCustomizable || false,
  });
  const [customFields, setCustomFields] = useState<CustomField[]>(
    (product?.customFields || []).map((f) => ({
      label: f.label,
      placeholder: f.placeholder || "",
      fieldType: f.fieldType || "text",
      options: (f.options || []).join(", "),
      isRequired: f.isRequired ?? true,
    }))
  );
  const [productDetails, setProductDetails] = useState<{ key: string; value: string }[]>(
    product?.productDetails || []
  );
  useEffect(() => {
    setForm({
      name: product?.name || "",
      description: product?.description || product?.shortDescription || "",
      price: String(product?.price || ""),
      comparePrice: String(product?.comparePrice || ""),
      minOrderQty: String(product?.minOrderQty || 1),
      giftOccasions: (product?.giftOccasions || []) as string[],
      isActive: product?.isActive !== undefined ? product.isActive : true,
      isCustomizable: product?.isCustomizable || false,
    });
    setCustomFields(
      (product?.customFields || []).map((f) => ({
        label: f.label,
        placeholder: f.placeholder || "",
        fieldType: f.fieldType || "text",
        options: (f.options || []).join(", "),
        isRequired: f.isRequired ?? true,
      }))
    );
    setProductDetails(product?.productDetails || []);
    setNewFiles([]);
    setExistingImageSlots(product?.images?.length ? product.images.map((i) => ({ ...i })) : []);
  }, [product]);
  const dynamicOccasions = Array.from(
    new Set(
      ((categoriesRes?.data?.categories || []) as GiftCategory[])
        .filter((c) => c?.isGiftCategory)
        .map((c) => {
          const t = String(c.giftType || "").trim();
          if (t) return t.charAt(0).toUpperCase() + t.slice(1);
          return String(c.name || "").trim();
        })
        .filter(Boolean)
    )
  );

  const toggleOccasion = (occ: string) => {
    setForm((p) => ({
      ...p,
      giftOccasions: p.giftOccasions.some((o) => normalizeOccasion(o) === normalizeOccasion(occ))
        ? p.giftOccasions.filter((o) => normalizeOccasion(o) !== normalizeOccasion(occ))
        : [...p.giftOccasions, occ],
    }));
  };

  const handleRemoveExistingImage = async (index: number) => {
    if (!product?._id) return;
    if (existingImageSlots.length <= 1) {
      toast.error("At least one product image is required.");
      return;
    }
    const pub = existingImageSlots[index]?.publicId;
    if (!pub) {
      toast.error("Cannot remove this image.");
      return;
    }
    try {
      const res = await productApi.deleteImage(product._id, pub);
      const next = (res.data?.product as GiftProduct | undefined)?.images;
      if (next?.length) setExistingImageSlots(next);
      else setExistingImageSlots((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image removed");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to remove image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product && newFiles.length === 0) return toast.error("Upload at least one image");
    if (product && existingImageSlots.length === 0 && newFiles.length === 0) {
      return toast.error("Upload at least one image");
    }
    if (product && existingImageSlots.length + newFiles.length > 7) {
      return toast.error("Maximum 7 images per product (remove some or upload fewer).");
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.comparePrice) fd.append("comparePrice", form.comparePrice);
      fd.append("category", "Gifting");
      fd.append("isActive", String(form.isActive));
      fd.append("isGiftable", "true");
      fd.append("isCustomizable", String(form.isCustomizable));
      fd.append("minOrderQty", form.minOrderQty || "1");
      fd.append(
        "giftOccasions",
        JSON.stringify(
          Array.from(
            new Set(
              form.giftOccasions
                .map((o) => o.trim())
                .filter(Boolean)
            )
          )
        )
      );
      fd.append(
        "customFields",
        JSON.stringify(
          customFields.map((f) => ({
            label: f.label,
            placeholder: f.placeholder,
            fieldType: f.fieldType,
            options: f.options ? f.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
            isRequired: f.isRequired,
          }))
        )
      );
      fd.append(
        "productDetails",
        JSON.stringify(
          productDetails
            .filter((d) => d.key.trim() && d.value.trim())
            .map((d) => ({ key: d.key.trim(), value: d.value.trim() }))
        )
      );
      fd.append(
        "variants",
        JSON.stringify([{ sku: `GIFT-${Date.now()}`, stock: 999, size: "", color: "" }])
      );
      newFiles.forEach((f) => fd.append("images", f));

      let saved: GiftProduct | undefined;
      if (product) {
        const res = await productApi.update(product._id, fd);
        saved = (res.data?.product || undefined) as GiftProduct | undefined;
        toast.success("Gift product updated");
      } else {
        const res = await productApi.create(fd);
        saved = (res.data?.product || undefined) as GiftProduct | undefined;
        toast.success("Gift product created");
      }
      onSave(saved);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gold-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-gold-600" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-900">
                {product ? "Edit Gift Product" : "Add Gift Product"}
              </h2>
              <p className="text-xs text-gray-400">Gift-specific product — no fabric/size/colour variants</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-7 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-7 max-h-[78vh] overflow-y-auto">
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Info</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Product Name *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Ethnic Gift Hamper with Dupatta" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description *</label>
                  <textarea className={`${inputCls} resize-none`} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={6} placeholder={"Paste rich text with line breaks/bullets, e.g.\n- Includes premium gift box\n- Personalized message card\n- Ready to ship"} required />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Tip: Multi-line and bullet-point content is supported and displayed cleanly on storefront.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Price (₹) *</label>
                    <input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="2499" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">MRP / Compare (₹)</label>
                    <input type="number" min="0" step="0.01" className={inputCls} value={form.comparePrice} onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))} placeholder="2999" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gifting Settings</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Min Order Qty <span className="text-gray-400 font-normal normal-case">(e.g. 5 for corporate)</span>
                  </label>
                  <input type="number" min="1" className={inputCls} value={form.minOrderQty} onChange={(e) => setForm((p) => ({ ...p, minOrderQty: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Gift Occasions</label>
                  {dynamicOccasions.length === 0 ? (
                    <p className="text-xs text-gray-400">No gift occasions found. Mark gift categories and set gift type in Categories.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {dynamicOccasions.map((occ) => (
                        <button key={occ} type="button" onClick={() => toggleOccasion(occ)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                            form.giftOccasions.some((o) => normalizeOccasion(o) === normalizeOccasion(occ))
                              ? "bg-gold-500 text-white border-gold-500"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gold-400"
                          )}>
                          {occ}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                  </button>
                  <span className="text-sm text-gray-700">Active / Visible on storefront</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setForm((p) => ({ ...p, isCustomizable: !p.isCustomizable }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isCustomizable ? "bg-brand-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isCustomizable ? "translate-x-5" : ""}`} />
                  </button>
                  <div>
                    <span className="text-sm text-gray-700 font-semibold block">Is Customizable?</span>
                    <span className="text-[10px] text-gray-400">Users must "Request Quote" instead of direct purchase.</span>
                  </div>
                </label>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Custom Input Fields for Users</h3>
                  <button type="button"
                    onClick={() => setCustomFields((p) => [...p, { label: "", placeholder: "", fieldType: "text", options: "", isRequired: true }])}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-full transition-colors">
                    <Plus className="h-3 w-3" /> Add Field
                  </button>
                </div>
                <p className="text-xs text-gray-400">These appear in the user's gift customization form — e.g. "Recipient Name", "Gift Message".</p>
                {customFields.length === 0 && <p className="text-xs text-gray-400 italic">No fields yet.</p>}
                <div className="space-y-3">
                  {customFields.map((f, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Label *</p>
                          <input className={inputCls} value={f.label} onChange={(e) => setCustomFields((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="e.g. Recipient Name" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Input Type</p>
                          <select className={inputCls} value={f.fieldType} onChange={(e) => setCustomFields((p) => p.map((x, j) => j === i ? { ...x, fieldType: e.target.value as "text" | "textarea" | "select" | "image" } : x))}>
                            <option value="text">Text (single line)</option>
                            <option value="textarea">Textarea (multiline)</option>
                            <option value="select">Dropdown (select)</option>
                            <option value="image">Image upload</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Placeholder / Hint</p>
                          <input className={inputCls} value={f.placeholder} onChange={(e) => setCustomFields((p) => p.map((x, j) => j === i ? { ...x, placeholder: e.target.value } : x))} placeholder="Hint for user" />
                        </div>
                        {f.fieldType === "select" && (
                          <div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Options (comma sep.)</p>
                            <input className={inputCls} value={f.options} onChange={(e) => setCustomFields((p) => p.map((x, j) => j === i ? { ...x, options: e.target.value } : x))} placeholder="Red, Blue, Green" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={f.isRequired} onChange={(e) => setCustomFields((p) => p.map((x, j) => j === i ? { ...x, isRequired: e.target.checked } : x))} className="rounded border-gray-300" />
                          <span className="text-xs text-gray-600">Required</span>
                        </label>
                        <button type="button" onClick={() => setCustomFields((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Detail Pairs</h3>
                  <button type="button" onClick={() => setProductDetails((p) => [...p, { key: "", value: "" }])}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-full transition-colors">
                    <Plus className="h-3 w-3" /> Add Detail
                  </button>
                </div>
                <div className="space-y-2">
                  {productDetails.map((d, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 bg-white rounded-xl p-3 border border-gray-100">
                      <input className={inputCls} value={d.key} onChange={(e) => setProductDetails((p) => p.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder="Key" />
                      <input className={inputCls} value={d.value} onChange={(e) => setProductDetails((p) => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="Value" />
                      <button type="button" onClick={() => setProductDetails((p) => p.filter((_, j) => j !== i))} className="h-10 w-10 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 grid place-items-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-50 rounded-2xl p-5 sticky top-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product Images</h3>
                <ImageUploader
                  key={product?._id ?? "new-gift-product"}
                  maxFiles={7}
                  aspectRatio="1:1"
                  maxSizeMB={12}
                  existingImages={existingImageSlots.map((i) => i.url)}
                  onRemoveExisting={product ? handleRemoveExistingImage : undefined}
                  onChange={setNewFiles}
                  hint={
                    product
                      ? "Up to 7 images total. Hover a photo and use ✕ to remove, or add new ones."
                      : "First image becomes the cover (up to 7 images)."
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
            <p className="text-xs text-gray-400">* Required fields</p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60 transition-colors flex items-center gap-2">
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : product ? "Save Changes" : "Create Gift Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Request Expand Panel ───────────────────────────────────────────────────
function RequestExpandPanel({ req, updateMutation }: { req: GiftingRequest; updateMutation: { mutate: (arg: { id: string; payload: Record<string, unknown> }, opts?: { onSuccess?: () => void }) => void; isPending: boolean } }) {
  const [note, setNote] = useState(req.adminNote || "");
  const [price, setPrice] = useState(req.quotedPrice ? String(req.quotedPrice) : "");
  const [delivery, setDelivery] = useState(req.deliveryTime || "");
  const [saved, setSaved] = useState(false);
  const [isEditingQuote, setIsEditingQuote] = useState(req.status === 'new');

  const handleSaveDetails = () => {
    updateMutation.mutate({
      id: req._id,
      payload: { adminNote: note, quotedPrice: price, deliveryTime: delivery },
    }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const handleSendQuote = () => {
    if (!price || Number(price) <= 0) return toast.error("Enter a valid quoted price before sending.");
    updateMutation.mutate({
      id: req._id,
      payload: { status: 'price_quoted', adminNote: note, quotedPrice: price, deliveryTime: delivery },
    }, {
      onSuccess: () => {
        setIsEditingQuote(false);
        toast.success("Quote sent successfully!");
      }
    });
  };

  return (
    <div className="border-t border-gray-50 bg-gradient-to-b from-gray-50/80 to-white">
      <div className="p-5 space-y-5">

        {/* ── User Details ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><User className="h-3 w-3" /> Customer</p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">{req.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3 text-gray-300" />{req.email}</div>
              {req.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3 text-gray-300" />{req.phone}</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Tag className="h-3 w-3" /> Order Details</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Occasion</span>
                <span className="text-xs font-bold text-gray-800">{req.occasion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Packaging</span>
                <span className="text-xs font-semibold text-gray-700 capitalize">{req.packagingPreference || "standard"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Submitted</span>
                <span className="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><IndianRupee className="h-3 w-3" /> Pricing</p>
            <div className="space-y-1.5">
              {Number(req.proposedPrice || 0) > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">User's Budget</p>
                  <p className="text-sm font-bold text-amber-600">{formatPrice(Number(req.proposedPrice || 0))}</p>
                </div>
              )}
              {Number(req.quotedPrice || 0) > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Quoted Price</p>
                  <p className="text-sm font-bold text-brand-600">{formatPrice(Number(req.quotedPrice || 0))}</p>
                </div>
              )}
              {!req.proposedPrice && !req.quotedPrice && (
                <p className="text-xs text-gray-400 italic">No pricing yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Items with product detail ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Requested Items ({req.items?.length || 0})</p>
          </div>
          <div className="divide-y divide-gray-50">
            {req.items?.map((item, i: number) => (
              <div key={i} className="p-4 flex gap-4">
                {/* Product thumbnail */}
                <div className="relative h-16 w-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                  {item.product?.images?.[0]?.url ? (
                    <Image src={item.product.images[0].url} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: <span className="font-semibold text-gray-600">{item.quantity}</span></p>
                      {item.product?.description && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.product.description}</p>
                      )}
                    </div>
                    {item.product?.price && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 whitespace-nowrap flex-shrink-0">
                        Listed: {formatPrice(item.product.price)}
                      </span>
                    )}
                  </div>
                  {(item.customFieldAnswers?.length || 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(item.customFieldAnswers || []).map((a, j: number) => (
                        <span key={j} className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">
                          <span className="text-brand-400">{a.label}:</span>
                          {typeof a.value === "string" && /^https?:\/\//.test(a.value) ? (
                            <a href={a.value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                              <span className="relative h-5 w-5 rounded overflow-hidden border border-brand-200">
                                <Image src={a.value} alt={a.label} fill sizes="20px" className="object-cover" />
                              </span>
                              <span className="font-bold underline">view image</span>
                            </a>
                          ) : (
                            <span className="font-bold">{a.value || "—"}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className={cn(
          "grid grid-cols-1 gap-4", 
          [req.recipientMessage, req.customizationNote, req.customPackagingNote].filter(Boolean).length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"
        )}>
          {req.recipientMessage && (
            <div className="bg-gold-50/60 rounded-2xl border border-gold-100 p-4">
              <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Recipient Message
              </p>
              <p className="text-sm text-gray-800 italic leading-relaxed break-words whitespace-pre-wrap">"{req.recipientMessage}"</p>
            </div>
          )}
          {req.customizationNote && (
            <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-4">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Customization Note
              </p>
              <p className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">{req.customizationNote}</p>
            </div>
          )}
          {(req.packagingPreference || "standard") === "custom" && req.customPackagingNote && (
            <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-4">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Package className="h-3 w-3" /> Custom Packaging Request
              </p>
              <p className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">{req.customPackagingNote}</p>
            </div>
          )}
        </div>

        {/* ── Reference Images ── */}
        {(req.referenceImages?.length || 0) > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reference Images</p>
            <div className="flex flex-wrap gap-3">
              {(req.referenceImages || []).map((img, idx: number) => (
                <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer"
                  className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200 hover:border-gold-400 transition-colors bg-white shadow-sm group">
                  <Image src={img.url} alt={`Reference ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Admin Action Panel ── */}
        {(req.status === 'price_quoted' && !isEditingQuote) ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4" /> Quote Sent to Customer
              </p>
              <p className="text-xs text-emerald-600/80 font-medium">They have been notified via email and in-app alert.</p>
            </div>
            <button 
              onClick={() => setIsEditingQuote(true)}
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              Edit Quote
            </button>
          </div>
        ) : (req.status === 'new' || (req.status === 'price_quoted' && isEditingQuote)) ? (
          <div className="bg-white rounded-2xl border-2 border-brand-100 p-5 space-y-4">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" /> Admin Response
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Internal Note</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Note visible to customer..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all resize-none placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Quoted Price (₹) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Enter final price..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all placeholder:text-gray-300"
                />
                {Number(req.proposedPrice || 0) > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">Customer's budget: {formatPrice(Number(req.proposedPrice || 0))}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Delivery Time</label>
                <input
                  value={delivery}
                  onChange={e => setDelivery(e.target.value)}
                  placeholder="e.g. 5-7 business days"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSaveDetails}
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2"
              >
                {saved ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Saved!</> : "Save Draft"}
              </button>
              <button
                onClick={handleSendQuote}
                disabled={updateMutation.isPending}
                className="px-7 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                  : <><Send className="h-3.5 w-3.5" /> Send Quote to Customer</>
                }
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Status Change (for non-quoting states) ── */}
        {req.status !== 'new' && req.status !== 'price_quoted' && (
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <p className="text-xs text-gray-500 font-medium">Change Status:</p>
            <select
              defaultValue={req.status}
              onChange={(e) => updateMutation.mutate({ id: req._id, payload: { status: e.target.value } })}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none font-semibold text-gray-700"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>

            {/* View linked order — appears once customer has approved */}
            {req.status === 'approved_by_user' && req.linkedOrderId && (
              <a
                href={`/admin/orders/${encodeURIComponent(req.linkedOrderId)}`}
                className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> View Linked Order →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AdminGiftingPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"products" | "requests">("products");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<GiftProduct | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Deep-link support: ?tab=requests&req=<requestId> auto-opens the specific request
  useEffect(() => {
    const tab = searchParams.get("tab");
    const req = searchParams.get("req");
    if (tab === "requests") setActiveTab("requests");
    if (req) setExpandedId(req);
  }, [searchParams]);

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["gifting-products-admin"],
    queryFn: () => giftingApi.getProducts({ limit: 100 }),
  });
  const giftProducts: GiftProduct[] = (productsData?.data?.products || []).map((p: GiftProduct) => ({
    ...p,
    isActive: p.isActive !== false,
  }));

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["gifting-requests", filterStatus],
    queryFn: () => giftingApi.getRequests({ ...(filterStatus && { status: filterStatus }), limit: 100 }),
    enabled: activeTab === "requests",
  });
  const requests = requestsData?.data?.requests || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      giftingApi.updateRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifting-requests"] });
      toast.success("Request updated successfully");
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this gift product?")) return;
    try {
      await productApi.delete(id);
      toast.success("Deleted");
      refetchProducts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const newRequestsCount = requests.filter((r: GiftingRequest) => r.status === 'new').length;

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-gold-500" />
            Gifting
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage gift products and customer requests</p>
        </div>
        {activeTab === "products" && (
          <button
            onClick={() => { setEditProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Gift Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["products", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all relative",
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab === "products" ? "🎁 Gift Products" : (
              <>
                📋 Requests
                {newRequestsCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {newRequestsCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {activeTab === "products" && (
        <div>
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : giftProducts.length === 0 ? (
            <div className="py-24 text-center">
              <Gift className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No gift products yet</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-3 text-sm text-brand-600 hover:underline">
                Add your first gift product →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {giftProducts.map((p: GiftProduct) => (
                <div key={p._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {p.images?.[0]?.url ? (
                      <Image src={p.images[0].url} alt={p.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Gift className="h-10 w-10 text-gray-200" /></div>
                    )}
                    {p.isActive === false && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-white text-xs font-bold text-gray-700 px-2 py-0.5 rounded-full">Inactive</span>
                      </div>
                    )}
                    {Number(p.minOrderQty || 1) > 1 && (
                      <span className="absolute top-1.5 left-1.5 bg-navy-900/90 text-gold-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Min {p.minOrderQty || 1}
                      </span>
                    )}
                    {p.isCustomizable && (
                      <span className="absolute top-1.5 right-1.5 bg-brand-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{p.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(p.price)}</p>
                    {(p.giftOccasions?.length || 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(p.giftOccasions || []).slice(0, 2).map((occ: string) => (
                          <span key={occ} className="text-[10px] bg-gold-50 text-gold-700 px-1.5 py-0.5 rounded-full border border-gold-200">{occ}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 mt-2.5">
                      <button
                        onClick={() => { setEditProduct(p); setIsModalOpen(true); }}
                        className="flex-1 py-1.5 text-xs font-medium text-gray-600 hover:text-brand-700 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className="flex-1 py-1.5 text-xs font-medium text-gray-600 hover:text-red-700 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500">{requests.length} request(s)</p>
            {newRequestsCount > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                {newRequestsCount} need attention
              </span>
            )}
          </div>

          {requestsLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No gifting requests yet</p>
            </div>
          ) : (
            requests.map((req: GiftingRequest) => {
              const statusConf = STATUS_CONFIG[req.status as Status] || STATUS_CONFIG.new;
              const StatusIcon = statusConf.icon;
              const isExpanded = expandedId === req._id;

              return (
                <div key={req._id} className={cn(
                  "bg-white border rounded-2xl overflow-hidden shadow-sm transition-all",
                  isExpanded ? "border-brand-200 shadow-md" : "border-gray-100 hover:border-gray-200"
                )}>
                  {/* ── Row Header ── */}
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  >
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border", statusConf.color)}>
                      <StatusIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{req.name}</p>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", statusConf.color)}>
                          {statusConf.label}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{req.occasion}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-gray-500">{req.items?.length || 0} item(s)</p>
                        <p className="text-xs text-gray-400">{formatDate(req.createdAt)}</p>
                        {req.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{req.phone}</p>}
                        {Number(req.proposedPrice || 0) > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            Budget: {formatPrice(Number(req.proposedPrice || 0))}
                          </span>
                        )}
                        {Number(req.quotedPrice || 0) > 0 && (
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                            Quoted: {formatPrice(Number(req.quotedPrice || 0))}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
                  </button>

                  {/* ── Expanded Panel ── */}
                  {isExpanded && <RequestExpandPanel req={req} updateMutation={updateMutation} />}
                </div>
              );
            })
          )}
        </div>
      )}

      {isModalOpen && (
        <GiftProductFormModal
          key={editProduct?._id || "new-gift-product"}
          product={editProduct}
          onClose={() => { setIsModalOpen(false); setEditProduct(null); }}
          onSave={(saved) => {
            setIsModalOpen(false);
            setEditProduct(null);
            if (saved?._id) {
              queryClient.setQueryData(
                ["gifting-products-admin"],
                (prev: { data?: { products?: GiftProduct[] } } | undefined) => {
                  const list = prev?.data?.products || [];
                  const idx = list.findIndex((p) => p._id === saved._id);
                  const nextList =
                    idx >= 0
                      ? list.map((p, i) => (i === idx ? saved : p))
                      : [saved, ...list];
                  return { ...(prev || {}), data: { ...(prev?.data || {}), products: nextList } };
                }
              );
            }
            refetchProducts();
          }}
        />
      )}
    </div>
  );
}
