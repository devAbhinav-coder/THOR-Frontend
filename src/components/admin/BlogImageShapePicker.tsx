"use client";

import type { BlogImageLayout } from "@/types";
import { BLOG_IMAGE_LAYOUTS } from "@/lib/blogGridLayouts";

const SHAPE_PREVIEW: Record<
  BlogImageLayout,
  { aspect: string; rounded: string; extra?: string }
> = {
  hero: { aspect: "aspect-[16/9]", rounded: "rounded-md" },
  wide: { aspect: "aspect-[16/9]", rounded: "rounded-lg" },
  portrait: { aspect: "aspect-[4/5]", rounded: "rounded-xl" },
  square: { aspect: "aspect-square", rounded: "rounded-2xl" },
  inline: { aspect: "aspect-[16/10]", rounded: "rounded-lg", extra: "shadow-sm" },
  split: { aspect: "aspect-square", rounded: "rounded-none" },
};

type Props = {
  value: BlogImageLayout;
  onChange: (layout: BlogImageLayout) => void;
  previewUrl?: string;
  compact?: boolean;
};

export default function BlogImageShapePicker({ value, onChange, previewUrl, compact = false }: Props) {
  return (
    <div className="space-y-2">
      {!compact && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Image shape</p>
      )}
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-6"}`}>
        {BLOG_IMAGE_LAYOUTS.map((layout) => {
          const shape = SHAPE_PREVIEW[layout.value];
          const active = value === layout.value;
          return (
            <button
              key={layout.value}
              type="button"
              onClick={() => onChange(layout.value)}
              title={layout.hint}
              className={`group flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                active ?
                  "border-brand-500 bg-brand-50/80 ring-2 ring-brand-200"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-full ${shape.aspect} ${shape.rounded} ${shape.extra || ""} overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-100`}
              >
                {previewUrl ?
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt=""
                    className={`w-full h-full object-cover ${layout.value === "square" ? "rounded-2xl" : ""}`}
                  />
                : <div className="w-full h-full flex items-end justify-center pb-1">
                    <div className="w-3/4 h-1 bg-gray-300/80 rounded-full" />
                  </div>
                }
              </div>
              <span
                className={`text-[9px] font-semibold text-center leading-tight ${
                  active ? "text-brand-700" : "text-gray-500"
                }`}
              >
                {layout.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
