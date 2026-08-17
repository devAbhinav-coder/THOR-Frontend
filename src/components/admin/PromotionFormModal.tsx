"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Promotion,
  Category,
  SubCategory,
  Product,
  PromoScopeType,
  PromotionType,
} from "@/types";
import { promotionApi, adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUploader from "@/components/ui/ImageUploader";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { UPLOAD_MAX_MB } from "@/lib/uploadLimits";
import { AdminAiPromotionTermsButton } from "@/components/admin/ai/AdminAiPromotionTermsButton";

interface Props {
  promotion: Promotion | null;
  onClose: () => void;
  onSave: () => void;
}

type PresetKey =
  | "b1g1"
  | "b2g1"
  | "b2g2"
  | "b5g2"
  | "buy2_200"
  | "buy1_100"
  | "buy5_500"
  | "pct10"
  | "custom";

const field =
  "w-full h-10 px-3 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900/30";

const PRESETS: Array<{ key: PresetKey; label: string; type: PromotionType }> = [
  { key: "b1g1", label: "Buy 1 Get 1 Free", type: "bogo" },
  { key: "b2g1", label: "Buy 2 Get 1 Free", type: "bogo" },
  { key: "b2g2", label: "Buy 2 Get 2 Free", type: "bogo" },
  { key: "b5g2", label: "Buy 5 Get 2 Free", type: "bogo" },
  { key: "buy2_200", label: "Buy 2 · ₹200 off", type: "flat" },
  { key: "buy1_100", label: "Buy 1 · ₹100 off", type: "flat" },
  { key: "buy5_500", label: "Buy 5 · ₹500 off", type: "flat" },
  { key: "pct10", label: "Buy 3+ · 10% off", type: "percentage" },
  { key: "custom", label: "Custom", type: "bogo" },
];

function applyPreset(key: PresetKey): Partial<ReturnType<typeof defaultForm>> {
  switch (key) {
    case "b1g1":
      return {
        promotionType: "bogo",
        buyQuantity: 1,
        getQuantity: 1,
        getDiscountPercent: 100,
      };
    case "b2g1":
      return {
        promotionType: "bogo",
        buyQuantity: 2,
        getQuantity: 1,
        getDiscountPercent: 100,
      };
    case "b2g2":
      return {
        promotionType: "bogo",
        buyQuantity: 2,
        getQuantity: 2,
        getDiscountPercent: 100,
      };
    case "b5g2":
      return {
        promotionType: "bogo",
        buyQuantity: 5,
        getQuantity: 2,
        getDiscountPercent: 100,
      };
    case "buy2_200":
      return { promotionType: "flat", buyQuantity: 2, discountValue: "200" };
    case "buy1_100":
      return { promotionType: "flat", buyQuantity: 1, discountValue: "100" };
    case "buy5_500":
      return { promotionType: "flat", buyQuantity: 5, discountValue: "500" };
    case "pct10":
      return {
        promotionType: "percentage",
        buyQuantity: 3,
        discountValue: "10",
      };
    default:
      return {};
  }
}

function defaultForm(promotion: Promotion | null) {
  return {
    name: promotion?.name || "",
    description: promotion?.description || "",
    termsAndConditions: promotion?.termsAndConditions || "",
    displayTitle: promotion?.displayTitle || "",
    badgeText: promotion?.badgeText || "Offer",
    promotionType: (promotion?.promotionType || "bogo") as PromotionType,
    buyQuantity: promotion?.buyQuantity ?? 1,
    getQuantity: promotion?.getQuantity ?? 1,
    getDiscountPercent: promotion?.getDiscountPercent ?? 100,
    discountValue: promotion?.discountValue?.toString() || "",
    maxDiscountAmount: promotion?.maxDiscountAmount?.toString() || "",
    minOrderAmount: promotion?.minOrderAmount?.toString() || "",
    showOnStorefront: promotion?.showOnStorefront !== false,
    scopeType: (promotion?.scopeType || "all") as PromoScopeType,
    categoryIds: (promotion?.categoryIds || []).map(String),
    subcategoryIds: (promotion?.subcategoryIds || []).map(String),
    productIds: (promotion?.productIds || []).map(String),
    startDate:
      promotion?.startDate ?
        new Date(promotion.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endDate:
      promotion ? new Date(promotion.endDate).toISOString().slice(0, 16) : "",
    isActive: promotion?.isActive !== undefined ? promotion.isActive : true,
    priority: promotion?.priority ?? 0,
    preset: "custom" as PresetKey,
  };
}

function scopeValidationError(data: {
  scopeType: PromoScopeType;
  categoryIds: string[];
  subcategoryIds: string[];
  productIds: string[];
}): string | null {
  if (data.scopeType === "categories" && !data.categoryIds.length)
    return "Select at least one category";
  if (data.scopeType === "subcategories" && !data.subcategoryIds.length) {
    return "Select at least one subcategory";
  }
  if (data.scopeType === "products" && !data.productIds.length)
    return "Select at least one product";
  return null;
}

export default function PromotionFormModal({
  promotion,
  onClose,
  onSave,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [productHits, setProductHits] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const existingImageUrl = clearImage ? null : promotion?.imageUrl || null;
  const [formData, setFormData] = useState(defaultForm(promotion));

  useEffect(() => {
    Promise.all([
      adminApi.getCategories({ active: false }),
      adminApi.getSubcategories(),
    ])
      .then(([catRes, subRes]) => {
        setCategories(catRes.data?.categories || []);
        setSubcategories(subRes.data?.subcategories || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ids = (promotion?.productIds || []).map(String);
    if (!ids.length) {
      setSelectedProducts([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        adminApi
          .getProductById(id)
          .then((res) => (res.data?.product as Product) ?? null)
          .catch(() => null),
      ),
    ).then((products) =>
      setSelectedProducts(products.filter(Boolean) as Product[]),
    );
  }, [promotion?._id, promotion?.productIds]);

  useEffect(() => {
    if (formData.scopeType !== "products" || productQuery.trim().length < 2) {
      setProductHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      adminApi
        .searchProducts({ q: productQuery.trim(), limit: 12 })
        .then((res) => setProductHits((res.data?.products || []) as Product[]))
        .catch(() => setProductHits([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [productQuery, formData.scopeType]);

  const toggleId = (
    fieldName: "categoryIds" | "subcategoryIds" | "productIds",
    id: string,
  ) => {
    setFormData((prev) => {
      const set = new Set(prev[fieldName]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [fieldName]: Array.from(set) };
    });
  };

  const applyPresetKey = (key: PresetKey) => {
    const preset = PRESETS.find((p) => p.key === key);
    const patch = applyPreset(key);
    setFormData((prev) => ({
      ...prev,
      preset: key,
      ...(preset ? { promotionType: preset.type } : {}),
      ...patch,
    }));
  };

  const refreshPreview = async () => {
    try {
      const res = await promotionApi.preview({
        scopeType: formData.scopeType,
        categoryIds:
          formData.scopeType === "categories" ? formData.categoryIds : [],
        subcategoryIds:
          formData.scopeType === "subcategories" ? formData.subcategoryIds : [],
        productIds:
          formData.scopeType === "products" ? formData.productIds : [],
      });
      setPreviewCount(Number((res.data as { count?: number })?.count ?? 0));
    } catch {
      setPreviewCount(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!formData.endDate) {
      toast.error("Please set an end date");
      return;
    }
    if (
      formData.promotionType !== "bogo" &&
      (!formData.discountValue || Number(formData.discountValue) <= 0)
    ) {
      toast.error("Please enter a valid discount value");
      return;
    }
    const scopeErr = scopeValidationError(formData);
    if (scopeErr) {
      toast.error(scopeErr);
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      if (formData.description) fd.append("description", formData.description);
      if (formData.termsAndConditions)
        fd.append("termsAndConditions", formData.termsAndConditions);
      if (formData.displayTitle)
        fd.append("displayTitle", formData.displayTitle);
      fd.append("badgeText", formData.badgeText || "Offer");
      fd.append("promotionType", formData.promotionType);
      fd.append("buyQuantity", String(Number(formData.buyQuantity) || 1));
      fd.append("showOnStorefront", String(formData.showOnStorefront));
      fd.append("scopeType", formData.scopeType);
      fd.append(
        "categoryIds",
        JSON.stringify(
          formData.scopeType === "categories" ? formData.categoryIds : [],
        ),
      );
      fd.append(
        "subcategoryIds",
        JSON.stringify(
          formData.scopeType === "subcategories" ? formData.subcategoryIds : [],
        ),
      );
      fd.append(
        "productIds",
        JSON.stringify(
          formData.scopeType === "products" ? formData.productIds : [],
        ),
      );
      fd.append("startDate", new Date(formData.startDate).toISOString());
      fd.append("endDate", new Date(formData.endDate).toISOString());
      fd.append("isActive", String(formData.isActive));
      fd.append("priority", String(Number(formData.priority) || 0));

      if (formData.promotionType === "bogo") {
        fd.append("getQuantity", String(Number(formData.getQuantity) || 1));
        fd.append(
          "getDiscountPercent",
          String(Number(formData.getDiscountPercent) || 100),
        );
      } else {
        fd.append("discountValue", String(Number(formData.discountValue)));
        if (
          formData.promotionType === "percentage" &&
          formData.maxDiscountAmount
        ) {
          fd.append(
            "maxDiscountAmount",
            String(Number(formData.maxDiscountAmount)),
          );
        }
      }
      if (formData.minOrderAmount) {
        fd.append("minOrderAmount", String(Number(formData.minOrderAmount)));
      }
      if (imageFile) fd.append("image", imageFile);
      if (clearImage && !imageFile) fd.append("clearImage", "true");

      if (promotion) {
        await promotionApi.update(promotion._id, fd);
        toast.success("Offer updated");
      } else {
        await promotionApi.create(fd);
        toast.success("Offer created — applies automatically in cart");
      }
      onSave();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to save offer");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4'>
      <div className='w-full sm:max-w-2xl max-h-[94vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl flex flex-col'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0'>
          <div>
            <p className='text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold'>
              Auto offers
            </p>
            <h2 className='text-lg font-serif font-semibold text-navy-900'>
              {promotion ? "Edit auto offer" : "New auto offer"}
            </h2>
            <p className='text-xs text-gray-500 mt-0.5'>
              No coupon code — applies automatically in cart
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full p-2 text-gray-400 hover:bg-gray-100'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='overflow-y-auto flex-1 px-5 py-4 space-y-5'
        >
          {formData.showOnStorefront ?
            <ImageUploader
              maxFiles={1}
              aspectRatio='3:4'
              maxSizeMB={UPLOAD_MAX_MB.sale}
              label='Popup & PDP image (optional)'
              hint='Same 3:4 crop as Sale popup. Shown on visit popup and product page.'
              existingImages={
                imageFile ? []
                : existingImageUrl ?
                  [existingImageUrl]
                : []
              }
              onRemoveExisting={() => {
                setImageFile(null);
                setClearImage(true);
              }}
              onChange={(files) => {
                const file = files[0] ?? null;
                setImageFile(file);
                if (file) setClearImage(false);
              }}
            />
          : null}

          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
              Quick preset
            </p>
            <div className='flex flex-wrap gap-2'>
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type='button'
                  onClick={() => applyPresetKey(p.key)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    formData.preset === p.key ?
                      "border-navy-900 bg-navy-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-300",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='sm:col-span-2'>
              <Input
                label='Internal name *'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Chanderi B1G1'
                required
              />
            </div>
            <Input
              label='Title on PDP / cart'
              value={formData.displayTitle}
              onChange={(e) =>
                setFormData({ ...formData, displayTitle: e.target.value })
              }
              placeholder='Buy 1 Get 1 Free'
            />
            <Input
              label='Badge text'
              value={formData.badgeText}
              onChange={(e) =>
                setFormData({ ...formData, badgeText: e.target.value })
              }
              placeholder='Offer'
            />
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Offer type *
              </label>
              <select
                value={formData.promotionType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promotionType: e.target.value as PromotionType,
                    preset: "custom",
                  })
                }
                className={field}
              >
                <option value='bogo'>Buy X Get Y (BOGO)</option>
                <option value='flat'>Flat ₹ off (min qty)</option>
                <option value='percentage'>Percentage off (min qty)</option>
              </select>
            </div>
            <Input
              label='Priority (tie-breaker)'
              type='number'
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className='rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 space-y-2 text-xs text-amber-950 leading-relaxed'>
            <p className='font-semibold text-amber-900'>
              Priority kaise kaam karti hai?
            </p>
            <p>
              <strong>Ek cart pe sirf 1 auto offer</strong> lagta hai. Jab 2+
              offers match karein:
            </p>
            <ol className='list-decimal list-inside space-y-1 pl-0.5'>
              <li>
                Pehle dekha jata hai <strong>kaun zyada ₹ bachaata hai</strong>{" "}
                — wahi lagta hai (priority se pehle).
              </li>
              <li>
                Agar dono <strong>same ₹ save</strong> karein, tab{" "}
                <strong>bada priority number</strong> jeetta hai.
              </li>
            </ol>
            <div className='grid sm:grid-cols-2 gap-2 pt-1'>
              <div className='rounded-lg bg-white/80 border border-amber-100 px-2.5 py-2'>
                <p className='font-semibold'>Priority 0</p>
                <p className='text-amber-900/80 mt-0.5'>
                  Default. Offer band nahi hota. Tie mein sabse kam preference.
                </p>
              </div>
              <div className='rounded-lg bg-white/80 border border-amber-100 px-2.5 py-2'>
                <p className='font-semibold'>Priority 1, 5, 10…</p>
                <p className='text-amber-900/80 mt-0.5'>
                  Tie pe 0 se upar. 10 &gt; 1 &gt; 0.
                </p>
              </div>
            </div>
            <p className='text-amber-900/90 pt-0.5'>
              Example: B1G1 (₹800 off, priority 0) vs ₹200 off (priority 100) →{" "}
              <strong>B1G1 lagta hai</strong> kyunki zyada saving. Priority
              tabhi matter karti hai jab saving barabar ho.
            </p>
          </div>

          <div className='rounded-xl border border-gray-100 bg-gray-50/80 p-3 grid grid-cols-2 sm:grid-cols-3 gap-3'>
            <Input
              label='Min buy qty *'
              type='number'
              value={formData.buyQuantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  buyQuantity: parseInt(e.target.value) || 1,
                  preset: "custom",
                })
              }
              min={1}
            />
            {formData.promotionType === "bogo" ?
              <>
                <Input
                  label='Get qty *'
                  type='number'
                  value={formData.getQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      getQuantity: parseInt(e.target.value) || 1,
                      preset: "custom",
                    })
                  }
                  min={1}
                />
                <Input
                  label='Get item discount %'
                  type='number'
                  value={formData.getDiscountPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      getDiscountPercent: parseInt(e.target.value) || 100,
                      preset: "custom",
                    })
                  }
                  min={0}
                  max={100}
                />
              </>
            : <>
                <Input
                  label={
                    formData.promotionType === "percentage" ?
                      "Discount % *"
                    : "Discount ₹ *"
                  }
                  type='number'
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: e.target.value,
                      preset: "custom",
                    })
                  }
                  required
                />
                {formData.promotionType === "percentage" ?
                  <Input
                    label='Max discount ₹'
                    type='number'
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value,
                      })
                    }
                  />
                : null}
              </>
            }
            <Input
              label='Min order ₹ (optional)'
              type='number'
              value={formData.minOrderAmount}
              onChange={(e) =>
                setFormData({ ...formData, minOrderAmount: e.target.value })
              }
            />
          </div>

          <div className='rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                Applies to
              </p>
              <button
                type='button'
                onClick={refreshPreview}
                className='text-xs font-medium text-brand-700 hover:underline'
              >
                Preview
                {previewCount != null ? `: ${previewCount} products` : ""}
              </button>
            </div>
            <select
              value={formData.scopeType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scopeType: e.target.value as PromoScopeType,
                })
              }
              className={field}
            >
              <option value='all'>Entire cart</option>
              <option value='categories'>Categories</option>
              <option value='subcategories'>Subcategories</option>
              <option value='products'>Specific products</option>
            </select>

            {formData.scopeType === "categories" ?
              <div className='max-h-36 overflow-y-auto space-y-1.5 pt-1'>
                {categories.map((c) => (
                  <label
                    key={c._id}
                    className='flex items-center gap-2 text-sm text-gray-700'
                  >
                    <input
                      type='checkbox'
                      checked={formData.categoryIds.includes(c._id)}
                      onChange={() => toggleId("categoryIds", c._id)}
                      className='rounded border-gray-300 text-navy-900'
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            : null}

            {formData.scopeType === "subcategories" ?
              <div className='max-h-36 overflow-y-auto space-y-1.5 pt-1'>
                {subcategories.map((s) => (
                  <label
                    key={s._id}
                    className='flex items-center gap-2 text-sm text-gray-700'
                  >
                    <input
                      type='checkbox'
                      checked={formData.subcategoryIds.includes(s._id)}
                      onChange={() => toggleId("subcategoryIds", s._id)}
                      className='rounded border-gray-300 text-navy-900'
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            : null}

            {formData.scopeType === "products" ?
              <div className='space-y-2 pt-1'>
                {formData.productIds.length > 0 ?
                  <div className='rounded-lg bg-brand-50/60 border border-brand-100 px-3 py-2 space-y-1'>
                    <p className='text-xs font-semibold text-brand-800'>
                      Selected ({formData.productIds.length})
                    </p>
                    {selectedProducts.map((p) => (
                      <label
                        key={p._id}
                        className='flex items-center gap-2 text-sm'
                      >
                        <input
                          type='checkbox'
                          checked={formData.productIds.includes(p._id)}
                          onChange={() => {
                            toggleId("productIds", p._id);
                            if (formData.productIds.includes(p._id)) {
                              setSelectedProducts((prev) =>
                                prev.filter((x) => x._id !== p._id),
                              );
                            }
                          }}
                          className='rounded border-gray-300 text-navy-900'
                        />
                        <span className='truncate'>{p.name}</span>
                      </label>
                    ))}
                  </div>
                : null}
                <Input
                  label='Search products'
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder='Type name…'
                />
                <div className='max-h-32 overflow-y-auto space-y-1'>
                  {productHits
                    .filter((p) => !formData.productIds.includes(p._id))
                    .map((p) => (
                      <label
                        key={p._id}
                        className='flex items-center gap-2 text-sm text-gray-700'
                      >
                        <input
                          type='checkbox'
                          checked={false}
                          onChange={() => {
                            toggleId("productIds", p._id);
                            setSelectedProducts((prev) =>
                              prev.some((x) => x._id === p._id) ? prev : (
                                [...prev, p]
                              ),
                            );
                          }}
                          className='rounded border-gray-300 text-navy-900'
                        />
                        <span className='truncate'>{p.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            : null}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Starts *
              </label>
              <input
                type='datetime-local'
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={field}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Ends *
              </label>
              <input
                type='datetime-local'
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={field}
                required
              />
            </div>
          </div>

          <Input
            label='Short description (optional)'
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder='Shown on popup and product page'
          />

          <div>
            <div className='flex items-center justify-between gap-2 mb-1'>
              <label className='block text-sm font-medium text-gray-700'>
                Terms &amp; conditions (optional)
              </label>
              <AdminAiPromotionTermsButton
                name={formData.name}
                displayTitle={formData.displayTitle}
                description={formData.description}
                promotionType={formData.promotionType}
                buyQuantity={formData.buyQuantity}
                getQuantity={formData.getQuantity}
                getDiscountPercent={formData.getDiscountPercent}
                discountValue={formData.discountValue}
                minOrderAmount={formData.minOrderAmount}
                scopeType={formData.scopeType}
                onTerms={(text) =>
                  setFormData({ ...formData, termsAndConditions: text })
                }
              />
            </div>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              rows={4}
              placeholder='Customer ko dikhne wali simple conditions — Click AI generate T&C '
              className='w-full px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-900/15'
            />
            <p className='mt-1 text-xs text-gray-500'>
              Product page aur visit popup pe dikhega. AI button offer type /
              qty ke hisaab se simple English T&amp;C likh deta hai.
            </p>
          </div>

          <label className='flex items-center gap-2 text-sm text-gray-700'>
            <input
              type='checkbox'
              checked={formData.showOnStorefront}
              onChange={(e) =>
                setFormData({ ...formData, showOnStorefront: e.target.checked })
              }
              className='rounded border-gray-300 text-navy-900'
            />
            Show on storefront (visit popup + product page)
          </label>
          <label className='flex items-center gap-2 text-sm text-gray-700'>
            <input
              type='checkbox'
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className='rounded border-gray-300 text-navy-900'
            />
            Active
          </label>
        </form>

        <div className='flex gap-2 p-4 border-t border-gray-100 bg-white shrink-0'>
          <Button variant='outline' className='flex-1' onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant='brand'
            className='flex-1'
            loading={isSaving}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            {promotion ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
