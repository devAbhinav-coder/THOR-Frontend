"use client";



import { useCallback, useState } from "react";

import { GripVertical, Trash2 } from "lucide-react";

import type { BlogImage, BlogImageLayout, BlogImagePlacement } from "@/types";

import { defaultLayoutForIndex, layoutLabel } from "@/lib/blogGridLayouts";

import {
  buildIndexRemap,
  contentHasImageMarker,
  remapImageMarkersInContent,
} from "@/lib/blogImageMarkers";



export type GalleryRow =

  | {

      kind: "existing";

      publicId: string;

      url: string;

      caption: string;

      layout: BlogImageLayout;

      placement: BlogImagePlacement;

    }

  | {

      kind: "new";

      preview: string;

      file: File;

      caption: string;

      layout: BlogImageLayout;

      placement: BlogImagePlacement;

    };



function previewAspectClass(layout: BlogImageLayout): string {

  switch (layout) {

    case "hero":

    case "wide":

      return "aspect-[16/9]";

    case "portrait":

      return "aspect-[4/5]";

    case "square":

    case "split":

      return "aspect-square";

    default:

      return "aspect-[16/10]";

  }

}



function placementBadge(

  placement: BlogImagePlacement,

  inContent: boolean,

): { label: string; className: string } {

  if (placement === "cover") {

    return { label: "Cover", className: "bg-amber-100 text-amber-900" };

  }

  if (placement === "gallery") {

    return { label: "End gallery", className: "bg-sky-100 text-sky-900" };

  }

  if (inContent) {

    return { label: "In story", className: "bg-emerald-100 text-emerald-900" };

  }

  return { label: "Not placed", className: "bg-gray-100 text-gray-600" };

}



type Props = {

  rows: GalleryRow[];

  onRowsChange: (rows: GalleryRow[]) => void;

  content: string;

  onContentChange: (content: string) => void;

  onRemoveExisting?: (publicId: string) => void;

  onInsertInStory?: (index: number) => void;

  onSetCover?: (index: number) => void;

  maxImages?: number;

};



export default function BlogImageGalleryEditor({

  rows,

  onRowsChange,

  content,

  onContentChange,

  onRemoveExisting,

  onInsertInStory,

  onSetCover,

  maxImages = 10,

}: Props) {

  const [dragIndex, setDragIndex] = useState<number | null>(null);



  const reorder = useCallback(

    (from: number, to: number) => {

      if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {

        return;

      }

      const next = [...rows];

      const [item] = next.splice(from, 1);

      next.splice(to, 0, item);

      const remap = buildIndexRemap(rows.length, from, to);

      onContentChange(remapImageMarkersInContent(content, remap));

      onRowsChange(next);

    },

    [rows, content, onContentChange, onRowsChange],

  );



  const updateRow = (index: number, patch: Partial<GalleryRow>) => {
    onRowsChange(
      rows.map((row, i) => (i === index ? ({ ...row, ...patch } as GalleryRow) : row)),
    );
  };



  const removeRow = (index: number) => {

    const row = rows[index];

    if (row.kind === "existing" && onRemoveExisting) {

      void onRemoveExisting(row.publicId);

      return;

    }

    if (row.kind === "new") {

      URL.revokeObjectURL(row.preview);

    }

    const next = rows.filter((_, i) => i !== index);

    const remap: number[] = [];

    let ni = 0;

    for (let oi = 0; oi < rows.length; oi++) {

      if (oi === index) continue;

      remap[oi] = ni;

      ni++;

    }

    onContentChange(remapImageMarkersInContent(content, remap));

    onRowsChange(next);

  };



  if (rows.length === 0) return null;



  return (

    <div className="space-y-3">

      <div>

        <h4 className="text-sm font-bold text-gray-800">Photo gallery</h4>

        <p className="text-xs text-gray-500 mt-0.5">
          Drag to reorder · captions · set cover or end gallery
        </p>

      </div>



      <div className="space-y-2">

        {rows.map((row, index) => {

          const url = row.kind === "existing" ? row.url : row.preview;

          const inContent = contentHasImageMarker(index, content);

          const badge = placementBadge(row.placement, inContent);

          const isDragging = dragIndex === index;



          return (

            <div
              key={row.kind === "existing" ? row.publicId : row.preview}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-gallery-index", String(index));
                e.dataTransfer.effectAllowed = "move";
                setDragIndex(index);
              }}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(
                  e.dataTransfer.getData("application/x-gallery-index"),
                );
                if (!Number.isNaN(from) && from !== index) reorder(from, index);
                setDragIndex(null);
              }}
              className={`flex gap-3 p-3 rounded-xl border bg-white transition-all ${
                isDragging ? "opacity-50 border-brand-400 scale-[0.98]" : "border-gray-200"
              } ${dragIndex !== null && dragIndex !== index ? "border-dashed border-brand-200" : ""}`}
            >
              <div
                className="self-center p-1 text-gray-400 cursor-grab active:cursor-grabbing touch-none"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>



              <div

                className={`relative w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 ${previewAspectClass(row.layout)}`}

              >

                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />

              </div>



              <div className="flex-1 min-w-0 space-y-2">

                <div className="flex items-center gap-2 flex-wrap">

                  <span className="text-xs font-black text-brand-700">#{index}</span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>

                    {badge.label}

                  </span>

                  <span className="text-[10px] text-gray-400 uppercase">

                    {row.kind === "existing" ? "saved" : "new"}

                  </span>

                </div>



                <div className="flex flex-wrap gap-1.5">
                  {onSetCover && row.placement !== "cover" && (
                    <button
                      type="button"
                      onClick={() => onSetCover(index)}
                      className="px-2 py-1 text-[10px] font-bold rounded-md border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    >
                      Set cover
                    </button>
                  )}
                  {onInsertInStory && row.placement !== "cover" && (
                    <button
                      type="button"
                      onClick={() => onInsertInStory(index)}
                      className="px-2 py-1 text-[10px] font-bold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    >
                      {inContent ? "In story ✓" : "Insert in story"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      updateRow(index, {
                        placement: row.placement === "gallery" ? "article" : "gallery",
                      })
                    }
                    className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-colors ${
                      row.placement === "gallery" ?
                        "border-sky-400 bg-sky-100 text-sky-900"
                      : "border-gray-200 bg-white text-gray-600 hover:border-sky-300"
                    }`}
                  >
                    {row.placement === "gallery" ? "End gallery ✓" : "End gallery"}
                  </button>
                </div>

                <input
                  type="text"
                  value={row.caption}
                  onChange={(e) => updateRow(index, { caption: e.target.value })}
                  placeholder="Caption (optional — used for split text side)"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                />
                {row.layout === "split" && (
                  <p className="text-[10px] text-violet-700 leading-snug">
                    Split: add caption here for text panel, or pair with another image in the Media panel above.
                  </p>
                )}
                <p className="text-[10px] text-gray-400">{layoutLabel(row.layout)}</p>

              </div>



              <button

                type="button"

                onClick={() => removeRow(index)}

                className="self-start p-1.5 text-gray-400 hover:text-red-600 rounded-lg"

              >

                <Trash2 className="w-4 h-4" />

              </button>

            </div>

          );

        })}

      </div>



      {rows.length >= maxImages && (

        <p className="text-xs text-amber-700 font-medium">Maximum {maxImages} images</p>

      )}

    </div>

  );

}



export function galleryRowsFromBlog(images: BlogImage[]): GalleryRow[] {

  return images.map((img, idx) => ({

    kind: "existing" as const,

    publicId: img.publicId,

    url: img.url,

    caption: img.caption || "",

    layout: img.layout || defaultLayoutForIndex(idx),

    placement:

      img.placement ||

      (idx === 0 ? "cover" : img.layout === "hero" ? "cover" : "article"),

  }));

}



export function galleryRowsToBlogImages(rows: GalleryRow[]): BlogImage[] {

  return rows.map((row) => {

    if (row.kind === "existing") {

      return {

        url: row.url,

        publicId: row.publicId,

        caption: row.caption,

        layout: row.layout,

        placement: row.placement,

      };

    }

    return {

      url: row.preview,

      publicId: `preview-${row.preview}`,

      caption: row.caption,

      layout: row.layout,

      placement: row.placement,

    };

  });

}


