"use client";

import { useCallback, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Product, ProductImage, ProductVariant } from "@/types";
import ImageUploader from "@/components/ui/ImageUploader";
import { cn } from "@/lib/utils";
import {
  VARIANT_MULTICOLOR_MARKER,
  variantSwatchBackground,
} from "@/lib/variantSwatch";
import { UPLOAD_MAX_MB } from "@/lib/uploadLimits";
import {
  distributeUntaggedProductImages,
  imagesForProductColor,
  normProductColor,
} from "@/lib/productColorImages";
import {
  isPresetProductSize,
  nextUnusedProductSize,
  PRODUCT_SIZES,
} from "@/lib/productCatalogOptions";

export type ColorSizeRow = {
  size: string;
  sku: string;
  stock: number;
  costPrice?: number;
};

export type ColorVariantGroup = {
  id: string;
  color: string;
  colorCode: string;
  kind: "solid" | "multicolor";
  existingImages: ProductImage[];
  newFiles: File[];
  sizes: ColorSizeRow[];
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400";

function newGroupId() {
  return `cg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateSku(colorName = "", size = "Free Size"): string {
  const colorPart =
    colorName.trim().replace(/\s+/g, "-").slice(0, 12).toUpperCase() || "PRD";
  const sizePart =
    size.trim().replace(/\s+/g, "-").slice(0, 8).toUpperCase() || "FREE";
  return `SKU-${colorPart}-${sizePart}-${Date.now().toString(36).slice(-5)}`;
}

function emptySizeRow(colorName = "", size = "Free Size"): ColorSizeRow {
  return { size, sku: generateSku(colorName, size), stock: 0 };
}

function cloneSizesFromTemplate(
  template: ColorVariantGroup,
  colorName = "",
): ColorSizeRow[] {
  if (!template.sizes.length) return [emptySizeRow(colorName)];
  return template.sizes.map((row) => ({
    size: row.size.trim() || "Free Size",
    sku: generateSku(colorName, row.size.trim() || "Free Size"),
    stock: 0,
    costPrice: undefined,
  }));
}

export function emptyColorGroup(): ColorVariantGroup {
  return {
    id: newGroupId(),
    color: "",
    colorCode: "#8B4513",
    kind: "solid",
    existingImages: [],
    newFiles: [],
    sizes: [emptySizeRow()],
  };
}

function newColorGroupFromTemplate(groups: ColorVariantGroup[]): ColorVariantGroup {
  const template = groups[0];
  if (!template) return emptyColorGroup();
  return {
    id: newGroupId(),
    color: "",
    colorCode: "#8B4513",
    kind: "solid",
    existingImages: [],
    newFiles: [],
    sizes: cloneSizesFromTemplate(template),
  };
}

function stableGroupId(colorKey: string, index: number): string {
  const slug = normProductColor(colorKey) || "default";
  return `cg-${slug}-${index}`;
}

export function colorGroupsFromProduct(product: Product | null): ColorVariantGroup[] {
  if (!product?.variants?.length) return [emptyColorGroup()];

  const byColor = new Map<string, ColorVariantGroup>();
  const colorOrder: string[] = [];

  for (const v of product.variants) {
    const rawColor = (v.color || "").trim();
    const colorKey = rawColor || "Default";
    const kind =
      v.colorCode === VARIANT_MULTICOLOR_MARKER ? "multicolor" : "solid";
    if (!byColor.has(colorKey)) {
      colorOrder.push(colorKey);
      const idx = colorOrder.length - 1;
      byColor.set(colorKey, {
        id: stableGroupId(colorKey, idx),
        color: rawColor,
        colorCode: v.colorCode || "#8B4513",
        kind,
        existingImages: imagesForProductColor(
          product.images || [],
          colorKey,
        ) as ProductImage[],
        newFiles: [],
        sizes: [],
      });
    }
    const g = byColor.get(colorKey)!;
    g.sizes.push({
      size: v.size || "Free Size",
      sku: v.sku,
      stock: v.stock ?? 0,
      costPrice: v.costPrice,
    });
  }

  let groups = colorOrder
    .map((key) => byColor.get(key)!)
    .filter(Boolean);

  const assignedIds = new Set(
    groups.flatMap((g) => g.existingImages.map((img) => img.publicId)),
  );
  const untagged = (product.images || []).filter(
    (img) => !normProductColor(img.color) && !assignedIds.has(img.publicId),
  );

  groups = distributeUntaggedProductImages(groups, untagged);

  return groups.length ? groups : [emptyColorGroup()];
}

export function flattenColorGroups(groups: ColorVariantGroup[]): ProductVariant[] {
  const out: ProductVariant[] = [];
  for (const g of groups) {
    const colorName = g.color.trim();
    for (const row of g.sizes) {
      if (!row.sku.trim()) continue;
      out.push({
        sku: row.sku.trim(),
        size: row.size.trim() || "Free Size",
        color: colorName || undefined,
        colorCode:
          g.kind === "multicolor" ?
            VARIANT_MULTICOLOR_MARKER
          : g.colorCode || "#000000",
        stock: Math.max(0, Number(row.stock) || 0),
        ...(row.costPrice != null && row.costPrice > 0 ?
          { costPrice: row.costPrice }
        : {}),
      });
    }
  }
  return out;
}

export function buildImagesMetaFromGroups(
  groups: ColorVariantGroup[],
): Array<{ publicId?: string; color?: string; alt?: string }> {
  const meta: Array<{ publicId?: string; color?: string; alt?: string }> = [];
  const multiColor = groups.length > 1;
  for (const g of groups) {
    const colorTag = g.color.trim();
    for (const img of g.existingImages) {
      meta.push({
        publicId: img.publicId,
        color: colorTag || (multiColor ? undefined : img.color),
        alt: img.alt,
      });
    }
    for (const _file of g.newFiles) {
      meta.push({ color: colorTag || undefined });
    }
  }
  return meta;
}

/** Admin save guard — every color group with media must have a name. */
export function validateColorGroupsForSave(
  groups: ColorVariantGroup[],
): string | null {
  if (groups.length > 1) {
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (!g.color.trim()) {
        return `Color ${i + 1}: color name likho (e.g. Red, Navy) — har shade alag hona chahiye.`;
      }
    }
  }
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const hasMedia = g.existingImages.length + g.newFiles.length > 0;
    if (hasMedia && !g.color.trim()) {
      return `Color ${i + 1}: is color ke photos hain — pehle color name daalo.`;
    }
  }
  const names = groups.map((g) => normProductColor(g.color)).filter(Boolean);
  if (new Set(names).size !== names.length) {
    return "Do colors ka same naam nahi ho sakta — alag alag names use karo.";
  }
  return null;
}

export function collectNewImageFiles(groups: ColorVariantGroup[]): File[] {
  return groups.flatMap((g) => g.newFiles);
}

type Props = {
  groups: ColorVariantGroup[];
  onChange: (groups: ColorVariantGroup[]) => void;
  productId?: string;
  untaggedImageCount?: number;
  onDeleteExistingImage?: (publicId: string, groupId: string) => void | Promise<void>;
};

export default function ProductColorVariantEditor({
  groups,
  onChange,
  productId,
  untaggedImageCount = 0,
  onDeleteExistingImage,
}: Props) {
  const updateGroup = useCallback(
    (id: string, patch: Partial<ColorVariantGroup>) => {
      onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    },
    [groups, onChange],
  );

  const totalImages = useMemo(
    () =>
      groups.reduce(
        (n, g) => n + g.existingImages.length + g.newFiles.length,
        0,
      ),
    [groups],
  );

  const untaggedCount = untaggedImageCount;

  return (
    <div className='space-y-4'>
      {untaggedCount > 0 ?
        <p className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900'>
          <strong>{untaggedCount} photo(s)</strong> abhi kisi color se linked
          nahi hain — pehle wale group mein dikhengi. Har color ke section mein
          sahi photos hon, phir <strong>Save</strong> karo taaki Brown sirf
          Brown pe rahe.
        </p>
      : null}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h3 className='text-xs font-bold uppercase tracking-widest text-gray-400'>
            Colors &amp; Sizes <span className='text-brand-500'>*</span>
          </h3>
          <p className='mt-1 max-w-xl text-xs leading-relaxed text-gray-500'>
            Har color ke liye alag photos upload karo. Size dropdown se choose
            karo — naya color add karoge to pehle color ke sizes auto copy
            ho jayenge (SKU khud ban jayega).
          </p>
        </div>
        <button
          type='button'
          onClick={() => onChange([...groups, newColorGroupFromTemplate(groups)])}
          className='inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100'
        >
          <Plus className='h-3.5 w-3.5' /> Add color
        </button>
      </div>

      {groups.map((group, groupIndex) => (
        <div
          key={group.id}
          className='space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'
        >
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400'>
              Color {groupIndex + 1}
            </span>
            {groups.length > 1 ?
              <button
                type='button'
                onClick={() => onChange(groups.filter((g) => g.id !== group.id))}
                className='text-gray-400 hover:text-red-500'
                aria-label='Remove color'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            : null}
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <label className='mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500'>
                Color name
              </label>
              <input
                className={inputCls}
                value={group.color}
                onChange={(e) => {
                  const color = e.target.value;
                  updateGroup(group.id, {
                    color,
                    existingImages: group.existingImages.map((img) => ({
                      ...img,
                      color: color.trim() || img.color,
                    })),
                    sizes: group.sizes.map((row) => ({
                      ...row,
                      sku:
                        row.sku.trim() ?
                          row.sku
                        : generateSku(color, row.size),
                    })),
                  });
                }}
                placeholder='Maroon, Navy Blue…'
              />
            </div>
            <div>
              <label className='mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500'>
                Swatch
              </label>
              <div className='flex gap-2'>
                <select
                  className={cn(inputCls, "w-28 shrink-0")}
                  value={group.kind}
                  onChange={(e) =>
                    updateGroup(group.id, {
                      kind: e.target.value as "solid" | "multicolor",
                    })
                  }
                >
                  <option value='solid'>Solid</option>
                  <option value='multicolor'>Multicolor</option>
                </select>
                {group.kind === "solid" ?
                  <input
                    type='color'
                    className='h-10 w-14 cursor-pointer rounded-lg border border-gray-200'
                    value={
                      group.colorCode.startsWith("#") ?
                        group.colorCode
                      : "#8B4513"
                    }
                    onChange={(e) =>
                      updateGroup(group.id, { colorCode: e.target.value })
                    }
                  />
                : null}
                <span
                  className='inline-flex h-10 w-10 shrink-0 rounded-full border border-gray-200'
                  style={{
                    background:
                      variantSwatchBackground(group.color, group.colorCode) ??
                      undefined,
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className='mb-2 block text-[10px] font-semibold uppercase tracking-wider text-gray-500'>
              Photos for this color
            </label>
            {groups.length > 1 && !group.color.trim() ?
              <p className='mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800'>
                Pehle upar <strong>color name</strong> likho (e.g. Red), phir
                is color ki photos upload karo — warna galat color pe save ho
                sakti hain.
              </p>
            : null}
            <div
              className={cn(
                groups.length > 1 &&
                  !group.color.trim() &&
                  "pointer-events-none opacity-45",
              )}
            >
            <ImageUploader
              key={group.id}
              maxFiles={7}
              aspectRatio='3:4'
              maxSizeMB={UPLOAD_MAX_MB.product}
              existingImages={group.existingImages.map((i) => i.url)}
              onChange={(files) => updateGroup(group.id, { newFiles: files })}
              onRemoveExisting={
                productId && onDeleteExistingImage ?
                  (index) => {
                    const img = group.existingImages[index];
                    if (img?.publicId) {
                      void onDeleteExistingImage(img.publicId, group.id);
                    }
                  }
                : undefined
              }
            />
            {group.newFiles.length > 0 ?
              <p className='mt-1.5 text-[11px] font-medium text-emerald-600'>
                {group.newFiles.length} new photo
                {group.newFiles.length === 1 ? "" : "s"} ready — save to upload
                {group.color.trim() ?
                  ` for ${group.color.trim()}`
                : ""}
              </p>
            : null}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-[10px] font-semibold uppercase tracking-wider text-gray-500'>
                Sizes &amp; stock
              </label>
              <button
                type='button'
                onClick={() => {
                  const nextSize = nextUnusedProductSize(
                    group.sizes.map((r) => r.size),
                  );
                  updateGroup(group.id, {
                    sizes: [
                      ...group.sizes,
                      emptySizeRow(group.color, nextSize),
                    ],
                  });
                }}
                className='text-xs font-medium text-brand-600 hover:text-brand-700'
              >
                + Add size
              </button>
            </div>
            {group.sizes.map((row, rowIndex) => {
              const presetSize = isPresetProductSize(row.size);
              const selectValue = presetSize ? row.size : "__custom__";
              return (
              <div
                key={`${group.id}-size-${rowIndex}`}
                className='grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-4'
              >
                <div className='space-y-1'>
                  <select
                    className={inputCls}
                    value={selectValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      const sizes = [...group.sizes];
                      if (val === "__custom__") {
                        sizes[rowIndex] = {
                          ...row,
                          size: presetSize ? "" : row.size,
                        };
                      } else {
                        sizes[rowIndex] = {
                          ...row,
                          size: val,
                          sku:
                            row.sku.trim() ?
                              row.sku
                            : generateSku(group.color, val),
                        };
                      }
                      updateGroup(group.id, { sizes });
                    }}
                  >
                    {PRODUCT_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value='__custom__'>Custom size…</option>
                  </select>
                  {!presetSize ?
                    <input
                      className={inputCls}
                      placeholder='Custom size'
                      value={row.size}
                      onChange={(e) => {
                        const sizes = [...group.sizes];
                        const size = e.target.value;
                        sizes[rowIndex] = {
                          ...row,
                          size,
                          sku:
                            row.sku.trim() ?
                              row.sku
                            : generateSku(group.color, size),
                        };
                        updateGroup(group.id, { sizes });
                      }}
                    />
                  : null}
                </div>
                <input
                  className={inputCls}
                  placeholder='SKU *'
                  value={row.sku}
                  onChange={(e) => {
                    const sizes = [...group.sizes];
                    sizes[rowIndex] = { ...row, sku: e.target.value };
                    updateGroup(group.id, { sizes });
                  }}
                />
                <input
                  type='number'
                  min={0}
                  className={inputCls}
                  placeholder='Stock'
                  value={row.stock}
                  onChange={(e) => {
                    const sizes = [...group.sizes];
                    sizes[rowIndex] = {
                      ...row,
                      stock: Math.max(0, Number(e.target.value) || 0),
                    };
                    updateGroup(group.id, { sizes });
                  }}
                />
                <div className='flex items-center gap-1'>
                  <input
                    type='number'
                    min={0}
                    className={inputCls}
                    placeholder='Cost ₹'
                    value={row.costPrice ?? ""}
                    onChange={(e) => {
                      const sizes = [...group.sizes];
                      const val = e.target.value;
                      sizes[rowIndex] = {
                        ...row,
                        costPrice: val ? Number(val) : undefined,
                      };
                      updateGroup(group.id, { sizes });
                    }}
                  />
                  {group.sizes.length > 1 ?
                    <button
                      type='button'
                      onClick={() =>
                        updateGroup(group.id, {
                          sizes: group.sizes.filter((_, i) => i !== rowIndex),
                        })
                      }
                      className='shrink-0 p-2 text-gray-400 hover:text-red-500'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  : null}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      ))}

      <p className='text-xs text-gray-400'>
        {totalImages} / 20 total images across all colors
      </p>
    </div>
  );
}
