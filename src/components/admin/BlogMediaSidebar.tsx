"use client";

import { Plus, Star, Upload, ImageIcon, Columns2 } from "lucide-react";
import type { GalleryRow } from "./BlogImageGalleryEditor";
import { contentHasImageMarker } from "@/lib/blogImageMarkers";
import { imageRowPartner, imageInStoryRow } from "@/lib/blogStoryPlanner";
import BlogImageShapePicker from "./BlogImageShapePicker";
import type { BlogImageLayout } from "@/types";

type Props = {
  rows: GalleryRow[];
  content: string;
  onSetCover: (index: number) => void;
  onInsertInStory: (index: number) => void;
  onInsertRow?: (a: number, b: number) => void;
  onOpenMediaLibrary: () => void;
  onUploadClick: () => void;
  onLayoutChange: (index: number, layout: BlogImageLayout) => void;
  onCaptionChange: (index: number, caption: string) => void;
  maxImages?: number;
};

export default function BlogMediaSidebar({
  rows,
  content,
  onSetCover,
  onInsertInStory,
  onInsertRow,
  onOpenMediaLibrary,
  onUploadClick,
  onLayoutChange,
  onCaptionChange,
  maxImages = 10,
}: Props) {
  const coverIdx = rows.findIndex((r) => r.placement === "cover");
  const storyRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.placement !== "cover");

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Featured image
        </h3>
        {coverIdx >= 0 ?
          (() => {
            const row = rows[coverIdx];
            const url = row.kind === "existing" ? row.url : row.preview;
            return (
              <div className="space-y-2">
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Featured" className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-white" /> Cover
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Hero banner at top of article — not inserted in story body.
                </p>
              </div>
            );
          })()
        : <p className="text-sm text-gray-500">Upload an image to set the featured cover.</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Media ({rows.length}/{maxImages})
          </h3>
          <button
            type="button"
            onClick={onOpenMediaLibrary}
            className="text-[10px] font-bold uppercase text-brand-600 hover:text-brand-700"
          >
            Library
          </button>
        </div>

        <p className="text-[11px] text-gray-500 -mt-1">
          Click thumbnail to insert at cursor in editor.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {rows.map((row, index) => {
            const url = row.kind === "existing" ? row.url : row.preview;
            const inStory = contentHasImageMarker(index, content);
            const isCover = row.placement === "cover";
            return (
              <div
                key={index}
                className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                  isCover ?
                    "border-amber-400"
                  : inStory ?
                    "border-emerald-400"
                  : "border-gray-200 hover:border-brand-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => !isCover && onInsertInStory(index)}
                  disabled={isCover}
                  className="w-full aspect-square relative disabled:cursor-default"
                  title={
                    isCover ? "Featured cover"
                    : inStory ? "Already in story"
                    : "Insert at cursor"
                  }
                >
                  {url ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  }
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-bold text-white text-center py-0.5">
                    #{index + 1}
                    {isCover ? " · Cover" : inStory ? " · In story" : ""}
                  </span>
                </button>
                {!isCover && (
                  <button
                    type="button"
                    onClick={() => onSetCover(index)}
                    className="absolute top-1 right-1 p-1 rounded bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Set as featured cover"
                  >
                    <Star className="w-3 h-3 text-amber-600" />
                  </button>
                )}
              </div>
            );
          })}

          {rows.length < maxImages && (
            <button
              type="button"
              onClick={onUploadClick}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-600 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase">Upload</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenMediaLibrary}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Add Media
        </button>
      </div>

      {storyRows.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Image shape
          </h3>

          {storyRows.map(({ row, index }) => {
            const url = row.kind === "existing" ? row.url : row.preview;
            const rowPartner = imageRowPartner(content, index);
            const inRow = imageInStoryRow(content, index);
            const partnerOptions = rows
              .map((r, i) => ({ r, i }))
              .filter(
                ({ i }) =>
                  i !== index &&
                  rows[i].placement !== "cover" &&
                  !imageInStoryRow(content, i),
              );

            return (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-9 h-9 rounded overflow-hidden bg-gray-200 shrink-0">
                    {url ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    : null}
                  </span>
                  <span className="text-xs font-bold text-gray-700">Image #{index + 1}</span>
                  {inRow && rowPartner !== null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                      Paired with #{rowPartner + 1}
                    </span>
                  )}
                </div>

                <BlogImageShapePicker
                  compact
                  value={row.layout}
                  onChange={(layout) => onLayoutChange(index, layout)}
                  previewUrl={url}
                />
                {inRow && (
                  <p className="text-[10px] text-violet-700 leading-snug">
                    Shape applies to both images in the side-by-side row.
                  </p>
                )}

                {row.layout === "split" && !inRow && (
                  <div className="space-y-2 pt-1 border-t border-violet-100">
                    <p className="text-[10px] font-bold uppercase text-violet-800 tracking-wide">
                      Split options
                    </p>
                    <label className="block text-[11px] text-gray-600">
                      Text side (caption)
                    </label>
                    <textarea
                      value={row.caption}
                      onChange={(e) => onCaptionChange(index, e.target.value)}
                      rows={2}
                      placeholder="Quote or description for the right panel…"
                      className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg resize-y bg-white"
                    />
                    {partnerOptions.length > 0 && onInsertRow && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-gray-600">
                          Or pair with another image
                        </label>
                        <div className="flex gap-2">
                          <select
                            id={`split-partner-${index}`}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Choose image…
                            </option>
                            {partnerOptions.map(({ i }) => (
                              <option key={i} value={i}>
                                Image #{i + 1}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const sel = document.getElementById(
                                `split-partner-${index}`,
                              ) as HTMLSelectElement | null;
                              const partner = Number(sel?.value);
                              if (!Number.isNaN(partner) && partner >= 0) {
                                onInsertRow(index, partner);
                              }
                            }}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                          >
                            <Columns2 className="w-3 h-3" />
                            Insert row
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Inserts both images side-by-side in the editor.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
