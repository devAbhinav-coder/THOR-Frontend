"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MarketingEdition } from "@/types";
import { editionShopHref, normalizeMarketingEditionSlug } from "@/lib/marketingEditions";
import ExploreHouseShowcaseCard from "@/components/home/ExploreHouseShowcaseCard";
import ImageUploader from "@/components/ui/ImageUploader";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-transparent";

const ACCENTS: MarketingEdition["accent"][] = [
  "gold",
  "rose",
  "festive",
  "emerald",
  "ink",
];

function emptyEdition(): MarketingEdition {
  return {
    slug: "",
    label: "",
    filterLabel: "",
    accent: "gold",
    isActive: true,
    showOnCard: true,
    showInFilter: true,
    showInExploreHouse: false,
    exploreName: "",
    exploreSubtitle: "THE EDIT",
    exploreImage: "",
    shopLink: "",
    sortOrder: 0,
    seoTitle: "",
    seoDescription: "",
    indexable: true,
  };
}

type Props = {
  editions: MarketingEdition[];
  onChange: (next: MarketingEdition[]) => void;
  editionImageFiles: Record<number, File | null>;
  onEditionImageFile: (index: number, file: File | null) => void;
};

function newRowKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `edition-${Date.now()}-${Math.random()}`;
}

export default function MarketingEditionsAdminPanel({
  editions,
  onChange,
  editionImageFiles,
  onEditionImageFile,
}: Props) {
  /** Stable keys — never tie to slug/label or inputs remount every keystroke. */
  const [rowKeys, setRowKeys] = useState<string[]>([]);

  useEffect(() => {
    setRowKeys((prev) => {
      if (editions.length === prev.length) return prev;
      if (editions.length > prev.length) {
        const added = Array.from(
          { length: editions.length - prev.length },
          () => newRowKey(),
        );
        return [...prev, ...added];
      }
      return prev.slice(0, editions.length);
    });
  }, [editions.length]);

  const patch = (index: number, patchRow: Partial<MarketingEdition>) => {
    onChange(
      editions.map((row, i) => (i === index ? { ...row, ...patchRow } : row)),
    );
  };

  const addRow = () => {
    setRowKeys((prev) => [...prev, newRowKey()]);
    onChange([...editions, emptyEdition()]);
  };

  const removeRow = (index: number) => {
    setRowKeys((prev) => prev.filter((_, i) => i !== index));
    onChange(editions.filter((_, i) => i !== index));
    onEditionImageFile(index, null);
  };

  return (
    <div className='space-y-6'>
      <p className='text-sm leading-relaxed text-gray-600'>
        Tyohar edits, limited drops, or &quot;New&quot; campaigns. Product pe
        same{" "}
        <strong className='font-semibold text-gray-800'>tag slug</strong> add
        karo (Product → Category & tags). Band off karne ke liye{" "}
        <strong className='font-semibold text-gray-800'>Active</strong> band
        karo ya date pass karo.
      </p>

      {editions.length === 0 ?
        <p className='rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500'>
          Abhi koi marketing edit nahi. Neeche &quot;Add edition&quot; dabao.
        </p>
      : null}

      {editions.map((row, index) => {
        const slug = normalizeMarketingEditionSlug(row.slug || row.label);
        const shopHref =
          String(row.shopLink || "").trim() || editionShopHref(slug || "slug");
        const previewImage =
          editionImageFiles[index] ?
            URL.createObjectURL(editionImageFiles[index]!)
          : row.exploreImage;

        return (
          <div
            key={rowKeys[index] ?? `edition-fallback-${index}`}
            className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5'
          >
            <div className='mb-4 flex items-start justify-between gap-3'>
              <div>
                <h3 className='font-serif text-lg text-gray-900'>
                  {row.label || `Edition ${index + 1}`}
                </h3>
                <p className='mt-0.5 font-mono text-[11px] text-gray-400'>
                  tag: {slug || "—"} · shop: {shopHref}
                </p>
              </div>
              <button
                type='button'
                onClick={() => removeRow(index)}
                className='rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600'
                aria-label='Remove edition'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              <div className='space-y-3'>
                <label className='block text-xs font-semibold text-gray-600'>
                  Card badge label
                  <input
                    className={cn(inputCls, "mt-1.5")}
                    value={row.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      patch(index, {
                        label,
                        slug:
                          row.slug ?
                            row.slug
                          : normalizeMarketingEditionSlug(label),
                      });
                    }}
                    placeholder='Tyohar Edit'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-600'>
                  Tag slug (product tags)
                  <input
                    className={cn(inputCls, "mt-1.5 font-mono text-xs")}
                    value={row.slug}
                    onChange={(e) => patch(index, { slug: e.target.value })}
                    onBlur={(e) =>
                      patch(index, {
                        slug: normalizeMarketingEditionSlug(e.target.value),
                      })
                    }
                    placeholder='tyohar-edit'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-600'>
                  Shop filter label
                  <input
                    className={cn(inputCls, "mt-1.5")}
                    value={row.filterLabel || ""}
                    onChange={(e) =>
                      patch(index, { filterLabel: e.target.value })
                    }
                    placeholder='Same as badge or longer name'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-600'>
                  Accent
                  <select
                    className={cn(inputCls, "mt-1.5")}
                    value={row.accent || "gold"}
                    onChange={(e) =>
                      patch(index, {
                        accent: e.target.value as MarketingEdition["accent"],
                      })
                    }
                  >
                    {ACCENTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <label className='block text-xs font-semibold text-gray-600'>
                  SEO title (Google)
                  <input
                    className={cn(inputCls, "mt-1.5")}
                    value={row.seoTitle || ""}
                    onChange={(e) => patch(index, { seoTitle: e.target.value })}
                    placeholder='Optional — defaults from label'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-600'>
                  SEO description
                  <textarea
                    className={cn(inputCls, "mt-1.5 min-h-[72px]")}
                    value={row.seoDescription || ""}
                    onChange={(e) =>
                      patch(index, { seoDescription: e.target.value })
                    }
                    placeholder='Optional — India delivery, returns, festive edit…'
                    rows={3}
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-600'>
                  Custom shop link (optional)
                  <input
                    className={cn(inputCls, "mt-1.5 font-mono text-xs")}
                    value={row.shopLink || ""}
                    onChange={(e) => patch(index, { shopLink: e.target.value })}
                    placeholder={editionShopHref(slug || "tyohar-edit")}
                  />
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <label className='block text-xs font-semibold text-gray-600'>
                    Start (optional)
                    <input
                      type='datetime-local'
                      className={cn(inputCls, "mt-1.5")}
                      value={
                        row.startsAt ?
                          row.startsAt.slice(0, 16)
                        : ""
                      }
                      onChange={(e) =>
                        patch(index, {
                          startsAt:
                            e.target.value ?
                              new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                    />
                  </label>
                  <label className='block text-xs font-semibold text-gray-600'>
                    End (optional)
                    <input
                      type='datetime-local'
                      className={cn(inputCls, "mt-1.5")}
                      value={
                        row.endsAt ? row.endsAt.slice(0, 16) : ""
                      }
                      onChange={(e) =>
                        patch(index, {
                          endsAt:
                            e.target.value ?
                              new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                    />
                  </label>
                </div>
                <div className='flex flex-wrap gap-2 pt-1'>
                  {(
                    [
                      ["isActive", "Active"],
                      ["showOnCard", "Card badge"],
                      ["showInFilter", "Shop filter"],
                      ["showInExploreHouse", "Explore carousel"],
                      ["indexable", "Google index"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type='button'
                      onClick={() =>
                        patch(index, { [key]: !(row[key] !== false) })
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition",
                        row[key] !== false ?
                          "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-3'>
                <p className='text-xs font-semibold text-gray-600'>
                  Explore Our House card (optional)
                </p>
                <label className='block text-xs text-gray-500'>
                  Carousel title
                  <input
                    className={cn(inputCls, "mt-1")}
                    value={row.exploreName || ""}
                    onChange={(e) =>
                      patch(index, { exploreName: e.target.value })
                    }
                  />
                </label>
                <label className='block text-xs text-gray-500'>
                  Subtitle
                  <input
                    className={cn(inputCls, "mt-1")}
                    value={row.exploreSubtitle || ""}
                    onChange={(e) =>
                      patch(index, { exploreSubtitle: e.target.value })
                    }
                  />
                </label>
                <ImageUploader
                  maxFiles={1}
                  aspectRatio='3:4'
                  existingImages={
                    editionImageFiles[index] ? [] : (
                      row.exploreImage ? [row.exploreImage] : []
                    )
                  }
                  onRemoveExisting={() => {
                    patch(index, {
                      exploreImage: "",
                      exploreImagePublicId: undefined,
                    });
                    onEditionImageFile(index, null);
                  }}
                  onChange={(files) => onEditionImageFile(index, files[0] || null)}
                  label='Carousel image'
                  hint='3:4 portrait — home & shop Explore strip'
                />
                {row.showInExploreHouse && previewImage ?
                  <div className='flex justify-center pt-2'>
                    <ExploreHouseShowcaseCard
                      disableLoader={Boolean(editionImageFiles[index])}
                      card={{
                        id: slug || `preview-${index}`,
                        name: row.exploreName || row.label || "Preview",
                        subtitle: (
                          row.exploreSubtitle || "THE EDIT"
                        ).toUpperCase(),
                        href: shopHref,
                        image: previewImage,
                      }}
                    />
                  </div>
                : null}
              </div>
            </div>
          </div>
        );
      })}

      <button
        type='button'
        onClick={addRow}
        className='inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50'
      >
        <Plus className='h-4 w-4' />
        Add edition
      </button>
    </div>
  );
}
