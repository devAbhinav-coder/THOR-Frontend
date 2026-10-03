"use client";

import { useEffect, useMemo, useState } from "react";
import { X as XIcon, Percent, TrendingDown, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import type { Category, SubCategory } from "@/types";
import AdminCategorySubcategoryFilters from "@/components/admin/shared/AdminCategorySubcategoryFilters";
import {
  fetchAdminCatalogCategories,
  fetchAdminCatalogSubcategories,
} from "@/lib/adminCatalog";
import { inventoryApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewResult = {
  productCount: number;
  skuCount: number;
  samples: {
    productId: string;
    productName: string;
    sku: string;
    oldPrice: number;
    newPrice: number;
  }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
  initialCategory?: string;
  initialSubcategory?: string;
};

export default function BulkSellingPriceModal({
  open,
  onClose,
  onApplied,
  initialCategory = "",
  initialSubcategory = "",
}: Props) {
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [percent, setPercent] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);

  const { data: catalogCategories = [] } = useQuery({
    queryKey: ["admin-catalog-categories"],
    queryFn: fetchAdminCatalogCategories,
    enabled: open,
  });

  const { data: catalogSubcategories = [] } = useQuery({
    queryKey: ["admin-catalog-subcategories"],
    queryFn: fetchAdminCatalogSubcategories,
    enabled: open,
  });

  const productCategoryOptions = useMemo(
    () =>
      (catalogCategories as Category[])
        .filter((c) => !c.isGiftCategory && c.name.toLowerCase() !== "gifting")
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [catalogCategories],
  );

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
    setSubcategory(initialSubcategory);
    setPercent("");
    setNote("");
    setPreview(null);
  }, [open, initialCategory, initialSubcategory]);

  useEffect(() => {
    setSubcategory("");
    setPreview(null);
  }, [category]);

  useEffect(() => {
    setPreview(null);
  }, [subcategory, percent]);

  if (!open) return null;

  const parsedPercent = parseFloat(percent);
  const percentValid =
    Number.isFinite(parsedPercent) &&
    parsedPercent !== 0 &&
    parsedPercent > -100 &&
    parsedPercent <= 500;

  const scopeLabel =
    category ?
      subcategory ?
        `${category} › ${subcategory}`
      : category
    : "";

  const runPreview = async () => {
    if (!category) {
      toast.error("Select a category first");
      return;
    }
    if (!percentValid) {
      toast.error("Enter a valid % change (−99 to +500, not 0)");
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await inventoryApi.bulkAdjustSellingPrice({
        category,
        subcategory: subcategory || undefined,
        percentChange: parsedPercent,
        dryRun: true,
      });
      const result = (
        res.data as { result?: PreviewResult }
      ).result;
      if (!result) {
        toast.error("Preview failed");
        return;
      }
      setPreview(result);
      if (result.skuCount === 0) {
        toast("No SKU prices would change in this scope", { icon: "ℹ️" });
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e ?
          String((e as { message: string }).message)
        : "Preview failed";
      toast.error(msg);
    } finally {
      setLoadingPreview(false);
    }
  };

  const apply = async () => {
    if (!category || !percentValid) return;
    if (!preview || preview.skuCount === 0) {
      toast.error("Run preview first — no SKUs to update");
      return;
    }
    const dir = parsedPercent > 0 ? "increase" : "decrease";
    const ok = window.confirm(
      `Apply ${Math.abs(parsedPercent)}% ${dir} to ${preview.skuCount} SKU(s) in ${scopeLabel}? This updates every variant sell price in scope.`,
    );
    if (!ok) return;

    setApplying(true);
    try {
      const res = await inventoryApi.bulkAdjustSellingPrice({
        category,
        subcategory: subcategory || undefined,
        percentChange: parsedPercent,
        dryRun: false,
        note: note.trim() || undefined,
      });
      const result = (res.data as { result?: PreviewResult }).result;
      toast.success(
        res.message ||
          `Updated ${result?.skuCount ?? preview.skuCount} SKU sell prices`,
      );
      onApplied();
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e ?
          String((e as { message: string }).message)
        : "Bulk update failed";
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h3 className='font-bold text-gray-900 flex items-center gap-2'>
              <Percent className='h-5 w-5 text-brand-600' />
              Bulk sell price
            </h3>
            <p className='text-xs text-gray-500 mt-1'>
              Adjust catalog sell prices by % for all SKUs in a category (and
              optional subcategory). Each variant is updated individually.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded-lg shrink-0'
            aria-label='Close'
          >
            <XIcon className='h-4 w-4' />
          </button>
        </div>

        <div className='space-y-3'>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase mb-1.5 block'>
              Scope
            </span>
            <AdminCategorySubcategoryFilters
              categories={productCategoryOptions}
              allSubcategories={catalogSubcategories as SubCategory[]}
              categoryValue={category}
              subcategoryValue={subcategory}
              onCategoryChange={setCategory}
              onSubcategoryChange={setSubcategory}
              className='w-full justify-start'
            />
          </div>

          <div>
            <label className='text-[10px] font-bold text-gray-400 uppercase mb-1 block'>
              Change (%)
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                step='0.1'
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder='e.g. 10 or -5'
                className='flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold'
              />
              {parsedPercent > 0 && (
                <TrendingUp className='h-5 w-5 text-emerald-600 shrink-0' />
              )}
              {parsedPercent < 0 && (
                <TrendingDown className='h-5 w-5 text-amber-600 shrink-0' />
              )}
            </div>
            <p className='text-[11px] text-gray-500 mt-1'>
              Positive = increase, negative = decrease. MRP / compare price is
              unchanged.
            </p>
          </div>

          <div>
            <label className='text-[10px] font-bold text-gray-400 uppercase mb-1 block'>
              Note (audit log)
            </label>
            <input
              type='text'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Optional reason for the log'
              maxLength={500}
              className='w-full h-10 px-3 rounded-xl border border-gray-200 text-sm'
            />
          </div>
        </div>

        {preview && (
          <div className='rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2'>
            <p className='text-sm font-semibold text-gray-800'>
              Preview:{" "}
              <span className='text-brand-700'>
                {preview.skuCount} SKU
                {preview.skuCount === 1 ? "" : "s"}
              </span>{" "}
              across {preview.productCount} product
              {preview.productCount === 1 ? "" : "s"}
            </p>
            {preview.samples.length > 0 && (
              <ul className='text-xs text-gray-600 space-y-1 max-h-36 overflow-y-auto'>
                {preview.samples.map((s) => (
                  <li key={`${s.productId}-${s.sku}`} className='truncate'>
                    <span className='font-medium text-gray-800'>
                      {s.productName}
                    </span>{" "}
                    · {s.sku}: {formatPrice(s.oldPrice)} →{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        s.newPrice > s.oldPrice ?
                          "text-emerald-700"
                        : "text-amber-700",
                      )}
                    >
                      {formatPrice(s.newPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className='flex flex-wrap gap-2 pt-1'>
          <Button
            type='button'
            variant='outline'
            className='rounded-xl'
            disabled={!category || !percentValid || loadingPreview}
            onClick={() => void runPreview()}
          >
            {loadingPreview ? "Preview…" : "Preview impact"}
          </Button>
          <Button
            type='button'
            variant='brand'
            className='rounded-xl flex-1 sm:flex-none'
            disabled={
              applying ||
              !preview ||
              preview.skuCount === 0 ||
              loadingPreview
            }
            onClick={() => void apply()}
          >
            {applying ? "Applying…" : "Apply to all SKUs"}
          </Button>
        </div>
      </div>
    </div>
  );
}
