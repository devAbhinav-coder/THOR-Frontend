"use client";

import { Star, ImageIcon } from "lucide-react";
import type { GalleryRow } from "./BlogImageGalleryEditor";

type Props = {
  rows: GalleryRow[];
  onSetCover: (index: number) => void;
};

export default function BlogFeaturedImage({ rows, onSetCover }: Props) {
  const coverIdx = rows.findIndex((r) => r.placement === "cover");
  const coverRow = coverIdx >= 0 ? rows[coverIdx] : null;
  const coverUrl =
    coverRow ?
      coverRow.kind === "existing" ? coverRow.url : coverRow.preview
    : null;

  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
        <h4 className="text-sm font-bold text-gray-900">Featured Image</h4>
        <span className="text-[10px] text-amber-700 font-medium uppercase tracking-wide">
          Displays in article header
        </span>
      </div>

      {coverUrl ?
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-48 aspect-[16/10] rounded-xl overflow-hidden border border-amber-200 bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="Featured cover" className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
              Cover
            </span>
          </div>
          <div className="flex-1 text-sm text-gray-600 space-y-2">
            <p>
              This image appears in the <strong>hero banner</strong> at the top of the published
              article. It is not inserted into the story body.
            </p>
            <p className="text-xs text-gray-500">
              To add images within the article, use <strong>Add Media</strong> in the content editor
              or select <strong>Insert in story</strong> from the gallery below.
            </p>
          </div>
        </div>
      : <div className="flex items-center gap-3 py-6 px-4 rounded-xl bg-white border border-amber-100 text-gray-500">
          <ImageIcon className="w-8 h-8 text-amber-300 shrink-0" />
          <p className="text-sm">
            Upload your first image — it will automatically become the featured cover. You can
            change it anytime from the gallery or media library.
          </p>
        </div>
      }

      {rows.length > 1 && (
        <div className="mt-4 pt-4 border-t border-amber-100">
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Change featured image</p>
          <div className="flex flex-wrap gap-2">
            {rows.map((row, i) => {
              const url = row.kind === "existing" ? row.url : row.preview;
              const isCover = row.placement === "cover";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSetCover(i)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    isCover ?
                      "border-amber-500 ring-2 ring-amber-200"
                    : "border-gray-200 hover:border-amber-300 opacity-80 hover:opacity-100"
                  }`}
                  title={`Set image ${i + 1} as featured cover`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {isCover ?
                    <span className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-700 fill-amber-500" />
                    </span>
                  : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function setCoverOnRows(rows: GalleryRow[], index: number): GalleryRow[] {
  return rows.map((row, i) => ({
    ...row,
    placement: i === index ? ("cover" as const) : row.placement === "cover" ? ("article" as const) : row.placement,
    layout: i === index ? ("hero" as const) : row.layout,
  }));
}

export { setCoverOnRows };
