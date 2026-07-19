"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Product, Category, SubCategory } from "@/types";
import { productApi, adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  bulkTextFromPairs,
  mergeFabricIntoProductDetails,
  pairsFromBulkInput,
} from "@/lib/productDetailsBulk";
import ProductDetailsBulkFields from "@/components/admin/ProductDetailsBulkFields";
import { PRODUCT_OCCASIONS } from "@/lib/productCatalogOptions";
import { cn } from "@/lib/utils";
import {
  AdminAiProductCopySection,
  type ProductCopyDraft,
} from "@/components/admin/ai/AdminAiProductCopySection";
import ProductSeoChecklist from "@/components/admin/ProductSeoChecklist";
import ProductColorVariantEditor, {
  buildImagesMetaFromGroups,
  collectNewImageFiles,
  colorGroupsFromProduct,
  emptyColorGroup,
  flattenColorGroups,
  validateColorGroupsForSave,
  type ColorVariantGroup,
} from "@/components/admin/ProductColorVariantEditor";
import { evaluateProductSeo } from "@/lib/productSeoChecklist";
import { fetchAdminCatalogCategories } from "@/lib/adminCatalog";

const MAX_PRODUCT_IMAGES = 20;

interface Props {
  product: Product | null;
  onClose: () => void;
  onSave: (savedProduct?: Product) => void;
}

const FABRICS = [
  "Silk",
  "Cotton",
  "Chiffon",
  "Georgette",
  "Banarasi",
  "Kanjeevaram",
  "Linen",
  "Crepe",
  "Net",
  "Velvet",
  "Other",
];

const Field = ({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div>
    <label className='block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'>
      {label} {required && <span className='text-brand-500'>*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all placeholder:text-gray-300";

export default function ProductFormModal({ product, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!!product?._id);
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);
  const editingProduct = loadedProduct ?? product;

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<SubCategory[]>([]);
  const [colorGroups, setColorGroups] = useState<ColorVariantGroup[]>([
    emptyColorGroup(),
  ]);
  const [showSeo, setShowSeo] = useState(false);
  const [detailsKeysText, setDetailsKeysText] = useState("");
  const [detailsValuesText, setDetailsValuesText] = useState("");

  const [customOccasion, setCustomOccasion] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    comparePrice: "",
    category: "",
    subcategory: "",
    fabric: "",
    occasions: [] as string[],
    tags: "",
    isFeatured: false,
    isActive: true,
    seoTitle: "",
    seoDescription: "",
    hsnCode: "",
  });

  const toggleOccasion = (occasion: string) => {
    setForm((prev) => {
      const exists = prev.occasions.some(
        (o) => o.toLowerCase() === occasion.toLowerCase(),
      );
      return {
        ...prev,
        occasions:
          exists ?
            prev.occasions.filter(
              (o) => o.toLowerCase() !== occasion.toLowerCase(),
            )
          : [...prev.occasions, occasion],
      };
    });
  };

  const addCustomOccasion = () => {
    const trimmed = customOccasion.trim();
    if (!trimmed) return;
    toggleOccasion(trimmed);
    setCustomOccasion("");
  };

  const hydrateFromProduct = useCallback((p: Product | null) => {
    if (!p) {
      setForm({
        name: "",
        description: "",
        shortDescription: "",
        price: "",
        comparePrice: "",
        category: "",
        subcategory: "",
        fabric: "",
        occasions: [] as string[],
        tags: "",
        isFeatured: false,
        isActive: true,
        seoTitle: "",
        seoDescription: "",
        hsnCode: "",
      });
      setColorGroups([emptyColorGroup()]);
      setDetailsKeysText("");
      setDetailsValuesText("");
      return;
    }
    setForm({
      name: p.name || "",
      description: p.description || "",
      shortDescription: p.shortDescription || "",
      price: p.price != null ? String(p.price) : "",
      comparePrice: p.comparePrice != null ? String(p.comparePrice) : "",
      category: p.category || "",
      subcategory: p.subcategory || "",
      fabric: p.fabric || "",
      occasions: [...(p.occasions || [])],
      tags: (p.tags || []).join(", "),
      isFeatured: p.isFeatured ?? false,
      isActive: p.isActive !== undefined ? p.isActive : true,
      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
      hsnCode: p.hsnCode || "",
    });
    setColorGroups(colorGroupsFromProduct(p));
    const { keysText, valuesText } = bulkTextFromPairs(p.productDetails || []);
    setDetailsKeysText(keysText);
    setDetailsValuesText(valuesText);
  }, []);

  useEffect(() => {
    fetchAdminCatalogCategories()
      .then(setCategories)
      .catch(() => {});
    adminApi
      .getSubcategories()
      .then((res) => setAllSubcategories(res.data?.subcategories || []))
      .catch(() => {});
  }, []);

  /** Keep specs table Fabric row in sync with the Fabric dropdown */
  useEffect(() => {
    const f = form.fabric.trim();
    if (!f) return;
    const merged = mergeFabricIntoProductDetails(
      detailsKeysText,
      detailsValuesText,
      f,
    );
    if (
      merged.keys !== detailsKeysText ||
      merged.values !== detailsValuesText
    ) {
      setDetailsKeysText(merged.keys);
      setDetailsValuesText(merged.values);
    }
  }, [form.fabric]); // eslint-disable-line react-hooks/exhaustive-deps -- sync only on fabric change

  useEffect(() => {
    const audit = evaluateProductSeo({
      name: form.name,
      shortDescription: form.shortDescription,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      fabric: form.fabric,
      category: form.category,
    });
    if (audit.score < 100) setShowSeo(true);
  }, [
    editingProduct?._id,
    form.name,
    form.shortDescription,
    form.seoTitle,
    form.seoDescription,
    form.fabric,
    form.category,
  ]);

  useEffect(() => {
    if (!product?._id) {
      setLoadedProduct(null);
      setLoadingProduct(false);
      hydrateFromProduct(null);
      return;
    }
    let cancelled = false;
    setLoadingProduct(true);
    setLoadedProduct(null);
    adminApi
      .getProductById(product._id)
      .then((res) => {
        if (cancelled) return;
        const full = (res.data?.product || product) as Product;
        setLoadedProduct(full);
        hydrateFromProduct(full);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Could not load full product — showing partial data");
        setLoadedProduct(product);
        hydrateFromProduct(product);
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product?._id, hydrateFromProduct]);

  const selectedCategory = categories.find((c) => c.name === form.category);
  const subcategories = allSubcategories.filter((s) => 
    s.categoryId === selectedCategory?._id || (s.categoryId as any)?._id === selectedCategory?._id || s.categorySlug === selectedCategory?.slug
  ).map(s => s.name);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setCategory = (category: string) => {
    setForm((prev) => ({ ...prev, category, subcategory: "" }));
  };

  const totalImageCount = colorGroups.reduce(
    (n, g) => n + g.existingImages.length + g.newFiles.length,
    0,
  );
  const flattenedVariants = flattenColorGroups(colorGroups);

  const untaggedImageCount = useMemo(() => {
    if (colorGroups.length <= 1) return 0;
    const meta = buildImagesMetaFromGroups(colorGroups);
    return meta.filter((m) => !m.color?.trim()).length;
  }, [colorGroups]);

  const handleDeleteExistingImage = async (
    publicId: string,
    groupId: string,
  ) => {
    if (!editingProduct?._id) return;
    if (totalImageCount <= 1) {
      toast.error("At least one product image is required.");
      return;
    }
    try {
      const res = await productApi.deleteImage(editingProduct._id, publicId);
      const updated = res.data?.product as Product | undefined;
      if (updated) setLoadedProduct(updated);
      setColorGroups((groups) =>
        groups.map((g) =>
          g.id === groupId ?
            {
              ...g,
              existingImages: g.existingImages.filter(
                (img) => img.publicId !== publicId,
              ),
            }
          : g,
        ),
      );
      toast.success("Image removed");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string }).message || "Failed to remove image",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFiles = collectNewImageFiles(colorGroups);
    const imagesMeta = buildImagesMetaFromGroups(colorGroups);

    if (totalImageCount < 1) {
      return toast.error("Upload at least one product image (per color)");
    }
    if (totalImageCount > MAX_PRODUCT_IMAGES) {
      return toast.error(
        `Maximum ${MAX_PRODUCT_IMAGES} images per product across all colors.`,
      );
    }
    if (!form.category) return toast.error("Please select a category");
    if (!flattenedVariants.length) {
      return toast.error("Add at least one size with a SKU");
    }
    if (flattenedVariants.some((v) => !v.sku.trim())) {
      return toast.error("Every variant needs a SKU");
    }

    const colorErr = validateColorGroupsForSave(colorGroups);
    if (colorErr) return toast.error(colorErr);

    const expectedNewUploads = imagesMeta.filter((m) => !m.publicId).length;
    if (expectedNewUploads !== newFiles.length) {
      return toast.error(
        "Photo upload sync error — refresh the page, re-add photos per color, and save again.",
      );
    }

    const detailsParsed = pairsFromBulkInput(
      detailsKeysText,
      detailsValuesText,
    );
    if (!detailsParsed.ok) return toast.error(detailsParsed.error);

    setIsSaving(true);
    setUploadProgress(newFiles.length > 0 ? 0 : null);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("shortDescription", form.shortDescription);
      fd.append("price", form.price);
      fd.append("comparePrice", form.comparePrice);
      fd.append("category", form.category);
      fd.append("subcategory", form.subcategory);
      fd.append("fabric", form.fabric);
      fd.append("isFeatured", String(form.isFeatured));
      fd.append("isActive", String(form.isActive));
      fd.append("seoTitle", form.seoTitle);
      fd.append("seoDescription", form.seoDescription);
      fd.append("hsnCode", form.hsnCode);
      fd.append(
        "variants",
        JSON.stringify(
          flattenedVariants.map((row) => ({
            sku: row.sku,
            size: row.size,
            color: row.color,
            colorCode: row.colorCode,
            stock: row.stock,
            ...(row.costPrice != null && row.costPrice > 0 ?
              { costPrice: row.costPrice }
            : {}),
          })),
        ),
      );
      fd.append("imagesMeta", JSON.stringify(imagesMeta));
      fd.append(
        "tags",
        JSON.stringify(
          form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      );
      fd.append("occasions", JSON.stringify(form.occasions));
      fd.append(
        "productDetails",
        JSON.stringify(
          detailsParsed.pairs.map((d) => ({
            key: d.key.trim(),
            value: d.value.trim(),
          })),
        ),
      );
      newFiles.forEach((f) => fd.append("images", f));

      let saved: Product | undefined;
      if (editingProduct?._id) {
        if (editingProduct.updatedAt) {
          fd.append("updatedAt", editingProduct.updatedAt);
        }
        const res = await productApi.update(editingProduct._id, fd, {
          onUploadProgress: (p) => setUploadProgress(p),
        });
        saved = (res.data?.product || undefined) as Product | undefined;
        if (saved?._id) {
          try {
            const fresh = await adminApi.getProductById(saved._id);
            saved = (fresh.data?.product || saved) as Product;
          } catch {
            /* use PATCH response */
          }
        }
        if (saved) {
          setLoadedProduct(saved);
          hydrateFromProduct(saved);
        }
        toast.success("Product updated");
      } else {
        const res = await productApi.create(fd, {
          onUploadProgress: (p) => setUploadProgress(p),
        });
        saved = (res.data?.product || undefined) as Product | undefined;
        if (saved?._id) {
          try {
            const fresh = await adminApi.getProductById(saved._id);
            saved = (fresh.data?.product || saved) as Product;
          } catch {
            /* use create response */
          }
        }
        if (saved) {
          setLoadedProduct(saved);
          hydrateFromProduct(saved);
        }
        toast.success("Product created");
      }
      onSave(saved);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string }).message || "Failed to save product",
      );
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6'>
      <div className='bg-white rounded-3xl w-full max-w-4xl max-h-full shadow-2xl animate-fadeIn flex flex-col overflow-hidden'>
        {/* ── Header ── */}
        <div className='flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0'>
          <div>
            <h2 className='text-xl font-serif font-bold text-gray-900'>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <p className='text-xs text-gray-400 mt-0.5'>
              {editingProduct ?
                `Editing: ${editingProduct.name}`
              : "Fill in product details below"}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col min-h-0 flex-1'>
          <div className='relative p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-8 overflow-y-auto overflow-x-hidden min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {loadingProduct && (
              <div className='absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm'>
                <Loader2 className='h-8 w-8 text-brand-600 animate-spin' />
                <p className='text-sm font-medium text-gray-600'>
                  Loading product…
                </p>
              </div>
            )}

            {/* ── LEFT: Details ── */}
            <div className='space-y-6 min-w-0'>
              {/* Basic info */}
              <div className='bg-gray-50 rounded-2xl p-5 space-y-4'>
                <h3 className='text-xs font-bold text-gray-400 uppercase tracking-widest'>
                  Basic Information
                </h3>
                <Field label='Product Name' required>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder='e.g. Banarasi Silk Saree in Royal Blue'
                    required
                  />
                </Field>
                <Field label='Description' required>
                  <textarea
                    className={`${inputCls} resize-none`}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder={
                      "Paste rich text with line breaks/bullets, e.g.\n- Pure silk weave\n- Handcrafted border\n- Dry clean only"
                    }
                    rows={6}
                    required
                  />
                  <p className='mt-1 text-[11px] text-gray-400'>
                    Tip: You can paste multi-line text and bullet points;
                    storefront now renders it in a readable format.
                  </p>
                </Field>
                <Field label='Short Description'>
                  <input
                    className={inputCls}
                    value={form.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    placeholder='2 sentences for listings (~120–200 chars) — AI fills this separately from long description'
                  />
                </Field>
                <Field label='HSN Code'>
                  <input
                    className={inputCls}
                    value={form.hsnCode}
                    onChange={(e) => set("hsnCode", e.target.value)}
                    placeholder='e.g. 6204'
                  />
                </Field>
              </div>

              {/* Pricing */}
              <div className='bg-gray-50 rounded-2xl p-5 space-y-4'>
                <h3 className='text-xs font-bold text-gray-400 uppercase tracking-widest'>
                  Pricing
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <Field label='Selling Price (₹)' required>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      className={inputCls}
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder='1499'
                      required
                    />
                  </Field>
                  <Field label='MRP / Compare Price (₹)'>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      className={inputCls}
                      value={form.comparePrice}
                      onChange={(e) => set("comparePrice", e.target.value)}
                      placeholder='1999'
                    />
                  </Field>
                </div>
                {form.price &&
                  form.comparePrice &&
                  Number(form.comparePrice) > Number(form.price) && (
                    <p className='text-xs text-green-600 font-medium'>
                      ✓{" "}
                      {Math.round(
                        ((Number(form.comparePrice) - Number(form.price)) /
                          Number(form.comparePrice)) *
                          100,
                      )}
                      % discount will be shown
                    </p>
                  )}
              </div>

              {/* Categorisation */}
              <div className='bg-gray-50 rounded-2xl p-5 space-y-4'>
                <h3 className='text-xs font-bold text-gray-400 uppercase tracking-widest'>
                  Categorisation
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <Field label='Category' required>
                    <select
                      className={inputCls}
                      value={form.category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value=''>Select category</option>
                      {categories
                        .filter(
                          (c) =>
                            !c.isGiftCategory &&
                            c.name.toLowerCase() !== "gifting",
                        )
                        .map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    {categories.length === 0 && (
                      <p className='text-xs text-amber-500 mt-1'>
                        Create categories in Admin → Categories first.
                      </p>
                    )}
                  </Field>
                  <Field label='Subcategory'>
                      <select
                        className={inputCls}
                        value={form.subcategory}
                        onChange={(e) => set("subcategory", e.target.value)}
                        disabled={!form.category || subcategories.length === 0}
                      >
                        <option value=''>None</option>
                        {subcategories.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {!form.category ? (
                        <p className='text-xs text-gray-400 mt-1'>Select a category first.</p>
                      ) : subcategories.length === 0 ? (
                        <p className='text-xs text-amber-500 mt-1'>No subcategories found for this category.</p>
                      ) : null}
                  </Field>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <Field label='Fabric'>
                    <select
                      className={inputCls}
                      value={form.fabric}
                      onChange={(e) => set("fabric", e.target.value)}
                    >
                      <option value=''>Select fabric</option>
                      {FABRICS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label='Tags (comma separated)'>
                    <input
                      className={inputCls}
                      value={form.tags}
                      onChange={(e) => set("tags", e.target.value)}
                      placeholder='silk, wedding, festive'
                    />
                  </Field>
                </div>
                <div className='grid grid-cols-1 gap-4'>
                  <Field label='Occasions'>
                    <div className='flex flex-wrap gap-2'>
                      {PRODUCT_OCCASIONS.map((occ) => (
                        <button
                          key={occ}
                          type='button'
                          onClick={() => toggleOccasion(occ)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                            form.occasions.some(
                              (o) => o.toLowerCase() === occ.toLowerCase(),
                            ) ?
                              "border-[#c5a059] bg-[#c5a059] text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[#c5a059]",
                          )}
                        >
                          {occ}
                        </button>
                      ))}
                      {form.occasions
                        .filter(
                          (o) =>
                            !PRODUCT_OCCASIONS.some(
                              (p) => p.toLowerCase() === o.toLowerCase(),
                            ),
                        )
                        .map((occ) => (
                          <button
                            key={occ}
                            type='button'
                            onClick={() => toggleOccasion(occ)}
                            className='rounded-full border border-[#c5a059] bg-[#c5a059]/10 px-3 py-1.5 text-xs font-semibold text-[#c5a059]'
                          >
                            {occ} ×
                          </button>
                        ))}
                    </div>
                    <div className='mt-3 flex gap-2'>
                      <input
                        className={inputCls}
                        value={customOccasion}
                        onChange={(e) => setCustomOccasion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomOccasion();
                          }
                        }}
                        placeholder='Add custom occasion…'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={addCustomOccasion}
                        disabled={!customOccasion.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </Field>
                </div>
                <div className='flex gap-6 pt-1'>
                  <label className='flex items-center gap-2.5 cursor-pointer group'>
                    <button
                      type='button'
                      onClick={() => set("isFeatured", !form.isFeatured)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeatured ? "bg-brand-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? "translate-x-5" : ""}`}
                      />
                    </button>
                    <span className='text-sm text-gray-700 group-hover:text-gray-900 transition-colors flex items-center gap-1'>
                      <Sparkles className='h-3.5 w-3.5 text-gold-500' />{" "}
                      Featured
                    </span>
                  </label>
                  <label className='flex items-center gap-2.5 cursor-pointer group'>
                    <button
                      type='button'
                      onClick={() => set("isActive", !form.isActive)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`}
                      />
                    </button>
                    <span className='text-sm text-gray-700 group-hover:text-gray-900 transition-colors'>
                      Active / Visible
                    </span>
                  </label>
                </div>
              </div>

              {/* Colors, sizes & photos */}
              <div className='bg-gray-50 rounded-2xl p-5'>
                <ProductColorVariantEditor
                  groups={colorGroups}
                  onChange={setColorGroups}
                  productId={editingProduct?._id}
                  untaggedImageCount={untaggedImageCount}
                  onDeleteExistingImage={handleDeleteExistingImage}
                />
              </div>

              <AdminAiProductCopySection
                name={form.name}
                category={form.category}
                subcategory={form.subcategory}
                fabric={form.fabric}
                price={form.price}
                comparePrice={form.comparePrice}
                tags={form.tags}
                variants={flattenedVariants}
                productId={editingProduct?._id}
                onApply={(d: ProductCopyDraft) => {
                  setForm((f) => ({
                    ...f,
                    shortDescription: d.shortDescription ?? f.shortDescription,
                    description: d.description ?? f.description,
                    seoTitle: d.seoTitle ?? f.seoTitle,
                    seoDescription: d.seoDescription ?? f.seoDescription,
                    tags: d.tags?.length ? d.tags.join(", ") : f.tags,
                  }));
                  const merged = mergeFabricIntoProductDetails(
                    d.productDetailKeys || "",
                    d.productDetailValues || "",
                    form.fabric,
                  );
                  if (merged.keys.trim()) {
                    setDetailsKeysText(merged.keys);
                    setDetailsValuesText(merged.values);
                  }
                  setShowSeo(true);
                }}
              />

              <div className='bg-gray-50 rounded-2xl p-5 space-y-3'>
                <h3 className='text-xs font-bold text-gray-400 uppercase tracking-widest'>
                  Product detail table (keys & values)
                </h3>
                <p className='text-xs text-gray-400'>
                  Shown on the product page as a specs table.{" "}
                  <strong>Fabric</strong> row fills automatically when you pick
                  fabric above (or use AI generate).
                </p>
                <ProductDetailsBulkFields
                  keysText={detailsKeysText}
                  valuesText={detailsValuesText}
                  onKeysChange={setDetailsKeysText}
                  onValuesChange={setDetailsValuesText}
                  textareaCls={`${inputCls} resize-y min-h-[140px] font-mono text-[13px] leading-relaxed`}
                />
              </div>

              {/* SEO */}
              <div className='bg-gray-50 rounded-2xl overflow-hidden'>
                <button
                  type='button'
                  onClick={() => setShowSeo(!showSeo)}
                  className='w-full flex items-center justify-between px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-colors'
                >
                  <span className='flex items-center gap-2'>
                    SEO for Google India
                    {evaluateProductSeo({
                      name: form.name,
                      shortDescription: form.shortDescription,
                      seoTitle: form.seoTitle,
                      seoDescription: form.seoDescription,
                      fabric: form.fabric,
                      category: form.category,
                    }).score < 100 && (
                      <span className='normal-case font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]'>
                        Needs work
                      </span>
                    )}
                  </span>
                  {showSeo ?
                    <ChevronUp className='h-4 w-4' />
                  : <ChevronDown className='h-4 w-4' />}
                </button>
                {showSeo && (
                  <div className='px-5 pb-5 space-y-4'>
                    <ProductSeoChecklist
                      name={form.name}
                      shortDescription={form.shortDescription}
                      seoTitle={form.seoTitle}
                      seoDescription={form.seoDescription}
                      fabric={form.fabric}
                      category={form.category}
                      onApplySuggestion={(patch) => {
                        if (patch.seoTitle) set("seoTitle", patch.seoTitle);
                        if (patch.seoDescription)
                          set("seoDescription", patch.seoDescription);
                        toast.success(
                          "SEO suggestions applied — review and save.",
                        );
                      }}
                    />
                    <Field label='SEO Title'>
                      <input
                        className={inputCls}
                        value={form.seoTitle}
                        onChange={(e) => set("seoTitle", e.target.value)}
                        placeholder='e.g. Buy Handpainted Kalamkari Silk Saree Online in India'
                        maxLength={70}
                      />
                      <p className='text-[11px] text-gray-400 mt-1'>
                        {form.seoTitle.length}/70 · Brand name is added
                        automatically in Google.
                      </p>
                    </Field>
                    <Field label='SEO Description'>
                      <textarea
                        className={`${inputCls} resize-none`}
                        value={form.seoDescription}
                        onChange={(e) => set("seoDescription", e.target.value)}
                        rows={3}
                        placeholder='120–160 chars: fabric, occasion, free delivery over ₹1,099, 5-day returns across India.'
                        maxLength={160}
                      />
                      <p
                        className={`text-[11px] mt-1 ${
                          form.seoDescription.length >= 120 ?
                            "text-emerald-600"
                          : "text-amber-600"
                        }`}
                      >
                        {form.seoDescription.length}/160 characters
                        {(
                          form.seoDescription.length > 0 &&
                          form.seoDescription.length < 120
                        ) ?
                          " — add more detail for better click-through"
                        : form.seoDescription.length >= 120 ?
                          " — good length for Google"
                        : ""}
                      </p>
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Photo tips ── */}
            <div className='space-y-4 min-w-0'>
              <div className='bg-gray-50 rounded-2xl p-5 space-y-4 sticky top-2'>
                <h3 className='text-xs font-bold text-gray-400 uppercase tracking-widest'>
                  Photo guide
                </h3>
                <p className='text-xs text-gray-400 leading-relaxed'>
                  Har color ke liye alag photos upload karo (left panel). Customer
                  jis color ko choose karega, product page par wahi images
                  dikhengi.
                </p>

                <div className='bg-white rounded-xl p-3 border border-gray-100 space-y-1.5'>
                  <p className='text-xs font-semibold text-gray-600'>
                    Photo tips
                  </p>
                  {[
                    "Use natural or studio lighting",
                    "3:4 portrait ratio (e.g. 900×1200px)",
                    "Show drape, texture & embroidery",
                    "Include model shots when possible",
                    "Same color ke saare angles ek color group mein rakho",
                  ].map((tip) => (
                    <p key={tip} className='text-xs text-gray-400 flex gap-1.5'>
                      <span className='text-brand-400 flex-shrink-0'>·</span>{" "}
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50 shrink-0'>
            <p className='text-xs text-gray-400'>
              {editingProduct ?
                "Changes will be saved immediately."
              : "* Required fields"}
            </p>
            <div className='flex gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='rounded-xl'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='brand'
                loading={isSaving}
                disabled={loadingProduct}
                className='rounded-xl px-8'
              >
                {isSaving ?
                  "Saving…"
                : editingProduct ?
                  "Save Changes"
                : "Create Product"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
