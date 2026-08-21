"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  IndianRupee,
  FolderTree,
  Palette,
  List,
  Search,
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
import { PRODUCT_FABRICS, PRODUCT_OCCASIONS } from "@/lib/productCatalogOptions";
import { resolveColorAgainstCatalog } from "@/lib/catalogAttributes";
import { useQuery } from "@tanstack/react-query";
import type { FilterOptions } from "@/types";
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
import type { PremiumEditorialPanel } from "@/lib/premiumCollectionData";
import {
  AdminOfferModal,
  AdminOfferSection,
  AdminOfferField,
  AdminOfferSwitch,
  adminOfferInputCls,
  adminOfferTextareaCls,
  adminOfferSelectCls,
} from "@/components/admin/shared/AdminOfferFormUi";

const MAX_PRODUCT_IMAGES = 20;
const PRODUCT_FORM_ID = "admin-product-form";

function defaultPremiumEditorialOpen(): PremiumEditorialPanel {
  return {
    title: "",
    fields: [
      { label: "Body", value: "" },
      { label: "Weave", value: "" },
    ],
    note: "",
  };
}

function defaultPremiumEditorialClose(): PremiumEditorialPanel {
  return {
    title: "",
    fields: [
      { label: "Detail", value: "" },
      { label: "Finish", value: "" },
    ],
    note: "",
  };
}

interface Props {
  product: Product | null;
  onClose: () => void;
  onSave: (savedProduct?: Product) => void;
}

export default function ProductFormModal({ product, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!!product?._id);
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);
  const editingProduct = loadedProduct ?? product;

  const { data: catalogFilterOptions } = useQuery({
    queryKey: ["admin-catalog-color-options"],
    queryFn: async () => {
      const res = await productApi.getFilterOptions();
      return res.data as FilterOptions;
    },
    staleTime: 5 * 60 * 1000,
  });
  const suggestedColors = catalogFilterOptions?.colors ?? [];

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
    isPremium: false,
    premiumSlug: "",
    premiumSubtitle: "",
    craftNote: "",
    weaveHours: "",
    sortOrderPremium: "0",
    seoTitle: "",
    seoDescription: "",
    hsnCode: "",
  });

  const [editorialOpen, setEditorialOpen] = useState<PremiumEditorialPanel>(
    defaultPremiumEditorialOpen,
  );
  const [editorialClose, setEditorialClose] = useState<PremiumEditorialPanel>(
    defaultPremiumEditorialClose,
  );
  const [premiumHeroFile, setPremiumHeroFile] = useState<File | null>(null);
  const [premiumHeroPreview, setPremiumHeroPreview] = useState<string | null>(
    null,
  );

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
        isPremium: false,
        premiumSlug: "",
        premiumSubtitle: "",
        craftNote: "",
        weaveHours: "",
        sortOrderPremium: "0",
        seoTitle: "",
        seoDescription: "",
        hsnCode: "",
      });
      setColorGroups([emptyColorGroup()]);
      setDetailsKeysText("");
      setDetailsValuesText("");
      setEditorialOpen(defaultPremiumEditorialOpen());
      setEditorialClose(defaultPremiumEditorialClose());
      setPremiumHeroFile(null);
      setPremiumHeroPreview(null);
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
      isPremium: p.isPremium ?? false,
      premiumSlug: p.premiumSlug || "",
      premiumSubtitle: p.premiumSubtitle || "",
      craftNote: p.craftNote || "",
      weaveHours: p.weaveHours != null ? String(p.weaveHours) : "",
      sortOrderPremium:
        p.sortOrderPremium != null ? String(p.sortOrderPremium) : "0",
      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
      hsnCode: p.hsnCode || "",
    });
    setColorGroups(colorGroupsFromProduct(p));
    const { keysText, valuesText } = bulkTextFromPairs(p.productDetails || []);
    setDetailsKeysText(keysText);
    setDetailsValuesText(valuesText);
    setEditorialOpen(
      p.premiumEditorialOpen ?
        {
          title: p.premiumEditorialOpen.title ?? "",
          fields:
            p.premiumEditorialOpen.fields?.length ?
              p.premiumEditorialOpen.fields
            : defaultPremiumEditorialOpen().fields,
          note: p.premiumEditorialOpen.note ?? "",
        }
      : defaultPremiumEditorialOpen(),
    );
    setEditorialClose(
      p.premiumEditorialClose ?
        {
          title: p.premiumEditorialClose.title ?? "",
          fields:
            p.premiumEditorialClose.fields?.length ?
              p.premiumEditorialClose.fields
            : defaultPremiumEditorialClose().fields,
          note: p.premiumEditorialClose.note ?? "",
        }
      : defaultPremiumEditorialClose(),
    );
    setPremiumHeroFile(null);
    setPremiumHeroPreview(p.premiumHeroImage?.url ?? null);
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

    const colorErr = validateColorGroupsForSave(colorGroups);
    if (colorErr) return toast.error(colorErr);

    const normalizedGroups = colorGroups.map((g) => {
      const color = resolveColorAgainstCatalog(g.color, suggestedColors);
      return {
        ...g,
        color,
        existingImages: g.existingImages.map((img) => ({
          ...img,
          color: color || img.color,
        })),
      };
    });
    setColorGroups(normalizedGroups);

    const newFiles = collectNewImageFiles(normalizedGroups);
    const imagesMeta = buildImagesMetaFromGroups(normalizedGroups);
    const variantsToSave = flattenColorGroups(normalizedGroups);
    const imageCount = normalizedGroups.reduce(
      (n, g) => n + g.existingImages.length + g.newFiles.length,
      0,
    );

    if (imageCount < 1) {
      return toast.error("Upload at least one product image (per color)");
    }
    if (imageCount > MAX_PRODUCT_IMAGES) {
      return toast.error(
        `Maximum ${MAX_PRODUCT_IMAGES} images per product across all colors.`,
      );
    }
    if (!form.category) return toast.error("Please select a category");
    if (!variantsToSave.length) {
      return toast.error("Add at least one size with a SKU");
    }
    if (variantsToSave.some((v) => !v.sku.trim())) {
      return toast.error("Every variant needs a SKU");
    }

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
      fd.append("isPremium", String(form.isPremium));
      if (form.premiumSlug.trim()) fd.append("premiumSlug", form.premiumSlug.trim());
      if (form.premiumSubtitle.trim()) {
        fd.append("premiumSubtitle", form.premiumSubtitle.trim());
      }
      if (form.craftNote.trim()) fd.append("craftNote", form.craftNote.trim());
      if (form.weaveHours.trim()) fd.append("weaveHours", form.weaveHours.trim());
      fd.append("sortOrderPremium", form.sortOrderPremium || "0");
      if (form.isPremium) {
        fd.append(
          "premiumEditorialOpen",
          JSON.stringify({
            title: editorialOpen.title?.trim() || undefined,
            fields: editorialOpen.fields.filter(
              (f) => f.label.trim() || f.value.trim(),
            ),
            note: editorialOpen.note.trim(),
          }),
        );
        fd.append(
          "premiumEditorialClose",
          JSON.stringify({
            title: editorialClose.title?.trim() || undefined,
            fields: editorialClose.fields.filter(
              (f) => f.label.trim() || f.value.trim(),
            ),
            note: editorialClose.note.trim(),
          }),
        );
      }
      if (premiumHeroFile) {
        fd.append("premiumHeroImage", premiumHeroFile);
      }
      fd.append("seoTitle", form.seoTitle);
      fd.append("seoDescription", form.seoDescription);
      fd.append("hsnCode", form.hsnCode);
      fd.append(
        "variants",
        JSON.stringify(
          variantsToSave.map((row) => ({
            sku: row.sku,
            size: row.size,
            color: row.color,
            colorCode: row.colorCode,
            stock: row.stock,
            ...(row.price != null && row.price >= 0 ? { price: row.price } : {}),
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
    <AdminOfferModal
      accent="product"
      maxWidth="4xl"
      eyebrow="Catalog"
      title={editingProduct ? "Edit product" : "Add product"}
      subtitle={
        editingProduct ?
          `Editing: ${editingProduct.name}`
        : "Name, pricing, photos per color, variants & SEO"
      }
      onClose={onClose}
      footerClassName="flex-col sm:flex-row sm:items-center sm:justify-between"
      footer={
        <>
          <p className="text-xs text-gray-500 sm:flex-1">
            {editingProduct ?
              "Changes save immediately."
            : "* Required fields"}
            {uploadProgress != null ?
              ` · Uploading ${Math.round(uploadProgress)}%`
            : null}
          </p>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={PRODUCT_FORM_ID}
              variant="brand"
              loading={isSaving}
              disabled={loadingProduct}
              className="flex-1 sm:flex-none sm:min-w-[140px]"
            >
              {isSaving ?
                "Saving…"
              : editingProduct ?
                "Save changes"
              : "Create product"}
            </Button>
          </div>
        </>
      }
    >
      <form id={PRODUCT_FORM_ID} onSubmit={handleSubmit} className="relative space-y-4">
        {loadingProduct && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm rounded-2xl min-h-[200px]">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
            <p className="text-sm font-medium text-gray-600">Loading product…</p>
          </div>
        )}

        <AdminOfferSection title="Basic information" description="Name, description & HSN" icon={Package}>
          <div className="space-y-3">
            <AdminOfferField label="Product name" required>
              <input
                className={adminOfferInputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Banarasi Silk Saree in Royal Blue"
                required
              />
            </AdminOfferField>
            <AdminOfferField label="Description" required hint="Paste bullets or multi-line text — storefront renders it cleanly.">
              <textarea
                className={cn(adminOfferTextareaCls, "min-h-[120px]")}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={"Pure silk weave\nHandcrafted border\nDry clean only"}
                rows={5}
                required
              />
            </AdminOfferField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminOfferField label="Short description" hint="~120–200 chars for listings">
                <input
                  className={adminOfferInputCls}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  placeholder="2 sentences for shop cards"
                />
              </AdminOfferField>
              <AdminOfferField label="HSN code">
                <input
                  className={adminOfferInputCls}
                  value={form.hsnCode}
                  onChange={(e) => set("hsnCode", e.target.value)}
                  placeholder="e.g. 6204"
                />
              </AdminOfferField>
            </div>
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Pricing" icon={IndianRupee}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminOfferField label="Selling price (₹)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={adminOfferInputCls}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="1499"
                required
              />
            </AdminOfferField>
            <AdminOfferField label="MRP / compare price (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                className={adminOfferInputCls}
                value={form.comparePrice}
                onChange={(e) => set("comparePrice", e.target.value)}
                placeholder="1999"
              />
            </AdminOfferField>
          </div>
          {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
            <p className="text-xs text-emerald-700 font-medium bg-emerald-50/80 rounded-lg px-3 py-2 border border-emerald-100">
              {Math.round(
                ((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100,
              )}
              % discount will show on storefront
            </p>
          )}
        </AdminOfferSection>

        <AdminOfferSection title="Category & tags" icon={FolderTree}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminOfferField label="Category" required>
              <select
                className={adminOfferSelectCls}
                value={form.category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories
                  .filter((c) => !c.isGiftCategory && c.name.toLowerCase() !== "gifting")
                  .map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Create categories in Admin → Categories first.</p>
              )}
            </AdminOfferField>
            <AdminOfferField label="Subcategory">
              <select
                className={adminOfferSelectCls}
                value={form.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                disabled={!form.category || subcategories.length === 0}
              >
                <option value="">None</option>
                {subcategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </AdminOfferField>
            <AdminOfferField label="Fabric">
              <select
                className={adminOfferSelectCls}
                value={form.fabric}
                onChange={(e) => set("fabric", e.target.value)}
              >
                <option value="">Select fabric</option>
                {PRODUCT_FABRICS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </AdminOfferField>
            <AdminOfferField label="Tags" hint="Comma separated">
              <input
                className={adminOfferInputCls}
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="silk, wedding, festive"
              />
            </AdminOfferField>
          </div>

          <AdminOfferField label="Occasions">
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => toggleOccasion(occ)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    form.occasions.some((o) => o.toLowerCase() === occ.toLowerCase()) ?
                      "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : "border-gray-200 bg-white/80 text-gray-600 hover:border-brand-400",
                  )}
                >
                  {occ}
                </button>
              ))}
              {form.occasions
                .filter((o) => !PRODUCT_OCCASIONS.some((p) => p.toLowerCase() === o.toLowerCase()))
                .map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleOccasion(occ)}
                    className="rounded-full border border-brand-500 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800"
                  >
                    {occ} ×
                  </button>
                ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className={cn(adminOfferInputCls, "flex-1")}
                value={customOccasion}
                onChange={(e) => setCustomOccasion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomOccasion();
                  }
                }}
                placeholder="Add custom occasion…"
              />
              <Button type="button" variant="outline" onClick={addCustomOccasion} disabled={!customOccasion.trim()}>
                Add
              </Button>
            </div>
          </AdminOfferField>

          <div className="flex flex-col sm:flex-row sm:gap-6 gap-3 pt-1 border-t border-gray-100/80">
            <AdminOfferSwitch
              checked={form.isFeatured}
              onChange={(v) => set("isFeatured", v)}
              label="Featured"
              description="Highlight on homepage & collections"
            />
            <AdminOfferSwitch
              checked={form.isActive}
              onChange={(v) => set("isActive", v)}
              label="Active / visible"
              description="Product appears on shop when on"
            />
            <AdminOfferSwitch
              checked={form.isPremium}
              onChange={(v) => set("isPremium", v)}
              label="Premium collection"
              description="Shows on /premium with editorial layout"
            />
          </div>

          {form.isPremium && (
            <div className="grid gap-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4 sm:grid-cols-2">
              <AdminOfferField label="Premium URL slug">
                <input
                  className={adminOfferInputCls}
                  value={form.premiumSlug}
                  onChange={(e) => set("premiumSlug", e.target.value)}
                  placeholder="rani-silk-rose-gold"
                />
              </AdminOfferField>
              <AdminOfferField label="Sort order">
                <input
                  className={adminOfferInputCls}
                  type="number"
                  min={0}
                  value={form.sortOrderPremium}
                  onChange={(e) => set("sortOrderPremium", e.target.value)}
                />
              </AdminOfferField>
              <AdminOfferField label="Premium subtitle">
                <input
                  className={adminOfferInputCls}
                  value={form.premiumSubtitle}
                  onChange={(e) => set("premiumSubtitle", e.target.value)}
                  placeholder="Handwoven Silk"
                />
              </AdminOfferField>
              <AdminOfferField label="Weave hours (Atelier headline)">
                <input
                  className={adminOfferInputCls}
                  type="number"
                  min={0}
                  value={form.weaveHours}
                  onChange={(e) => set("weaveHours", e.target.value)}
                />
              </AdminOfferField>
              <AdminOfferField label="Atelier craft note" className="sm:col-span-2">
                <textarea
                  className={adminOfferTextareaCls}
                  rows={3}
                  value={form.craftNote}
                  onChange={(e) => set("craftNote", e.target.value)}
                  placeholder="Shown in the Atelier note section below the editorial gallery…"
                />
              </AdminOfferField>

              <AdminOfferField label="Premium hero image" className="sm:col-span-2">
                <p className="mb-2 text-xs text-gray-500">
                  Full-screen hero on the product page. Separate from gallery images — used in the carousel with the first gallery shot.
                </p>
                {premiumHeroPreview ?
                  <div className="relative mb-3 aspect-[3/4] max-w-[200px] overflow-hidden rounded-lg border border-amber-200/80 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={premiumHeroPreview}
                      alt="Premium hero preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                : null}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-amber-900"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPremiumHeroFile(file);
                    setPremiumHeroPreview(URL.createObjectURL(file));
                  }}
                />
              </AdminOfferField>

              <div className="sm:col-span-2 space-y-6 border-t border-amber-200/60 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                    First editorial row (beside 1st gallery image)
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Body, Weave labels + note — shown next to the first image after hero.
                  </p>
                </div>
                <AdminOfferField label="Section title (optional)">
                  <input
                    className={adminOfferInputCls}
                    value={editorialOpen.title ?? ""}
                    onChange={(e) =>
                      setEditorialOpen((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </AdminOfferField>
                <div className="grid gap-3 sm:grid-cols-2">
                  {editorialOpen.fields.map((field, i) => (
                    <div key={i} className="grid gap-2 sm:col-span-1">
                      <input
                        className={adminOfferInputCls}
                        placeholder="Label (e.g. Body)"
                        value={field.label}
                        onChange={(e) =>
                          setEditorialOpen((p) => ({
                            ...p,
                            fields: p.fields.map((f, j) =>
                              j === i ? { ...f, label: e.target.value } : f,
                            ),
                          }))
                        }
                      />
                      <input
                        className={adminOfferInputCls}
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          setEditorialOpen((p) => ({
                            ...p,
                            fields: p.fields.map((f, j) =>
                              j === i ? { ...f, value: e.target.value } : f,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <AdminOfferField label="Editorial note">
                  <textarea
                    className={adminOfferTextareaCls}
                    rows={3}
                    value={editorialOpen.note}
                    onChange={(e) =>
                      setEditorialOpen((p) => ({ ...p, note: e.target.value }))
                    }
                  />
                </AdminOfferField>

                <div className="border-t border-amber-200/60 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                    Last editorial row (beside final image)
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Same layout as the first row — title, labels + values, and editorial note beside the last gallery image.
                  </p>
                </div>
                <AdminOfferField label="Section title (optional)">
                  <input
                    className={adminOfferInputCls}
                    value={editorialClose.title ?? ""}
                    onChange={(e) =>
                      setEditorialClose((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. The pallu"
                  />
                </AdminOfferField>
                <div className="grid gap-3 sm:grid-cols-2">
                  {editorialClose.fields.map((field, i) => (
                    <div key={i} className="grid gap-2 sm:col-span-1">
                      <input
                        className={adminOfferInputCls}
                        placeholder="Label (e.g. Pallu)"
                        value={field.label}
                        onChange={(e) =>
                          setEditorialClose((p) => ({
                            ...p,
                            fields: p.fields.map((f, j) =>
                              j === i ? { ...f, label: e.target.value } : f,
                            ),
                          }))
                        }
                      />
                      <input
                        className={adminOfferInputCls}
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          setEditorialClose((p) => ({
                            ...p,
                            fields: p.fields.map((f, j) =>
                              j === i ? { ...f, value: e.target.value } : f,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <AdminOfferField label="Editorial note">
                  <textarea
                    className={adminOfferTextareaCls}
                    rows={3}
                    value={editorialClose.note}
                    onChange={(e) =>
                      setEditorialClose((p) => ({ ...p, note: e.target.value }))
                    }
                  />
                </AdminOfferField>
              </div>
            </div>
          )}
        </AdminOfferSection>

        <AdminOfferSection
          title="Colors, sizes & photos"
          description="Upload photos per color — customer sees images for their chosen color"
          icon={Palette}
        >
          <ProductColorVariantEditor
            groups={colorGroups}
            onChange={setColorGroups}
            suggestedColors={suggestedColors}
            productId={editingProduct?._id}
            baseSellPrice={form.price}
            untaggedImageCount={untaggedImageCount}
            onDeleteExistingImage={handleDeleteExistingImage}
          />
        </AdminOfferSection>

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

        <AdminOfferSection
          title="Product specs table"
          description="Keys & values on the product page — Fabric row syncs from dropdown above"
          icon={List}
          variant="muted"
        >
          <ProductDetailsBulkFields
            keysText={detailsKeysText}
            valuesText={detailsValuesText}
            onKeysChange={setDetailsKeysText}
            onValuesChange={setDetailsValuesText}
            textareaCls={cn(adminOfferTextareaCls, "min-h-[120px] font-mono text-[13px] leading-relaxed")}
          />
        </AdminOfferSection>

        <AdminOfferSection
          title="SEO for Google India"
          icon={Search}
          variant="muted"
          action={
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              {showSeo ? "Collapse" : "Expand"}
              {showSeo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          }
        >
          {evaluateProductSeo({
            name: form.name,
            shortDescription: form.shortDescription,
            seoTitle: form.seoTitle,
            seoDescription: form.seoDescription,
            fabric: form.fabric,
            category: form.category,
          }).score < 100 && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              SEO needs work — expand to fix
            </p>
          )}
          {showSeo && (
            <div className="space-y-3">
              <ProductSeoChecklist
                name={form.name}
                shortDescription={form.shortDescription}
                seoTitle={form.seoTitle}
                seoDescription={form.seoDescription}
                fabric={form.fabric}
                category={form.category}
                onApplySuggestion={(patch) => {
                  if (patch.seoTitle) set("seoTitle", patch.seoTitle);
                  if (patch.seoDescription) set("seoDescription", patch.seoDescription);
                  toast.success("SEO suggestions applied — review and save.");
                }}
              />
              <AdminOfferField label="SEO title" hint={`${form.seoTitle.length}/70 · brand added in Google`}>
                <input
                  className={adminOfferInputCls}
                  value={form.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder="Buy Handpainted Kalamkari Silk Saree Online in India"
                  maxLength={70}
                />
              </AdminOfferField>
              <AdminOfferField label="SEO description">
                <textarea
                  className={cn(adminOfferTextareaCls, "min-h-[80px]")}
                  value={form.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  rows={3}
                  placeholder="120–160 chars: fabric, occasion, delivery, returns"
                  maxLength={160}
                />
                <p
                  className={cn(
                    "text-[11px] mt-1",
                    form.seoDescription.length >= 120 ? "text-emerald-600" : "text-amber-600",
                  )}
                >
                  {form.seoDescription.length}/160
                  {form.seoDescription.length > 0 && form.seoDescription.length < 120 ?
                    " — add more for better click-through"
                  : form.seoDescription.length >= 120 ?
                    " — good length"
                  : ""}
                </p>
              </AdminOfferField>
            </div>
          )}
        </AdminOfferSection>
      </form>
    </AdminOfferModal>
  );
}
