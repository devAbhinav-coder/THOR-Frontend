"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Star,
  ImagePlus,
  Columns2,
  FileImage,
  Check,
  Upload,
  AlignLeft,
} from "lucide-react";
import type { GalleryPreview } from "@/lib/blogContentEditor";
import { contentHasImageMarker, contentHasRowMarker } from "@/lib/blogImageMarkers";
import AdminFullScreenOverlay, { overlayScrollClass } from "./AdminFullScreenOverlay";

export type MediaLibraryItem = GalleryPreview & {
  inStory?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: MediaLibraryItem[];
  content: string;
  onInsert: (index: number) => void;
  onInsertRow: (a: number, b: number) => void;
  onSetCover: (index: number) => void;
  onSetGallery: (index: number) => void;
  onUploadRequest: () => void;
  maxImages?: number;
};

type Filter = "all" | "featured" | "available" | "in-story" | "gallery";

export default function BlogMediaLibraryModal({
  open,
  onClose,
  items,
  content,
  onInsert,
  onInsertRow,
  onSetCover,
  onSetGallery,
  onUploadRequest,
  maxImages = 10,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [multiSelect, setMultiSelect] = useState<number[]>([]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setMultiSelect([]);
      setFilter("all");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const enriched = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        inStory: contentHasImageMarker(item.index, content),
      })),
    [items, content],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "featured":
        return enriched.filter((i) => i.placement === "cover");
      case "available":
        return enriched.filter((i) => i.placement !== "cover" && !i.inStory);
      case "in-story":
        return enriched.filter((i) => i.inStory);
      case "gallery":
        return enriched.filter((i) => i.placement === "gallery");
      default:
        return enriched;
    }
  }, [enriched, filter]);

  const selectedItem = selected != null ? enriched.find((i) => i.index === selected) : null;

  const toggleSelect = (index: number) => {
    setSelected(index);
    setMultiSelect((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return [index];
      return [...prev, index];
    });
  };

  const handleInsert = () => {
    if (selected == null) return;
    const item = enriched.find((i) => i.index === selected);
    if (item?.placement === "cover") return;
    onInsert(selected);
    onClose();
  };

  const handleInsertRow = () => {
    if (multiSelect.length !== 2) return;
    const [a, b] = multiSelect.sort((x, y) => x - y);
    if (contentHasRowMarker([a, b], content)) return;
    onInsertRow(a, b);
    onClose();
  };

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All media", count: enriched.length },
    { id: "featured", label: "Featured", count: enriched.filter((i) => i.placement === "cover").length },
    { id: "available", label: "Available", count: enriched.filter((i) => i.placement !== "cover" && !i.inStory).length },
    { id: "in-story", label: "In story", count: enriched.filter((i) => i.inStory).length },
    { id: "gallery", label: "End gallery", count: enriched.filter((i) => i.placement === "gallery").length },
  ];

  return (
    <AdminFullScreenOverlay open={open} className="bg-[#0f1117]/98 backdrop-blur-md">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-[#1a1d26] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-600/20">
            <FileImage className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Media Library</h2>
            <p className="text-xs text-white/50">
              Select images to insert, set as featured, or add to the end gallery
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close media library"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-white/10 bg-[#151820] p-4 space-y-1 hidden sm:block">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id ?
                  "bg-brand-600/20 text-brand-300"
                : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
              <span className="text-xs opacity-60">{f.count}</span>
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onUploadRequest}
              disabled={items.length >= maxImages}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
            >
              <Upload className="w-4 h-4" />
              Upload new
            </button>
          </div>
        </aside>

        {/* Grid */}
        <main className={`flex-1 min-h-0 ${overlayScrollClass} p-6`}>
          {enriched.length === 0 ?
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center">
              <ImagePlus className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No images yet</h3>
              <p className="text-sm text-white/50 max-w-sm mb-6">
                Upload photos to your media library. The first image becomes the featured cover
                automatically.
              </p>
              <button
                type="button"
                onClick={onUploadRequest}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload images
              </button>
            </div>
          : filtered.length === 0 ?
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-white/40 text-sm">
              No images in this filter
            </div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((item) => {
                const isSelected = selected === item.index;
                const isMulti = multiSelect.includes(item.index);
                return (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => toggleSelect(item.index)}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isSelected || isMulti ?
                        "border-brand-500 ring-2 ring-brand-500/40 scale-[1.02]"
                      : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {item.url ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.caption || `Image ${item.index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    : <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/30 text-2xl font-bold">
                        {item.index + 1}
                      </div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 inset-x-0 p-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/90">#{item.index + 1}</span>
                      <div className="flex gap-1">
                        {item.placement === "cover" && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                        {item.inStory && (
                          <AlignLeft className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                    </div>
                    {(isSelected || isMulti) && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          }
        </main>

        {/* Detail panel */}
        {selectedItem && (
          <aside className="w-72 shrink-0 border-l border-white/10 bg-[#151820] p-5 space-y-4 hidden lg:flex flex-col">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
              {selectedItem.url ?
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedItem.url} alt="" className="w-full h-full object-cover" />
              : null}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Image #{selectedItem.index + 1}</p>
              {selectedItem.caption && (
                <p className="text-xs text-white/50 line-clamp-2">{selectedItem.caption}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedItem.placement === "cover" && (
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
                  Featured
                </span>
              )}
              {selectedItem.inStory && (
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  In story
                </span>
              )}
              {selectedItem.placement === "gallery" && (
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-sky-500/20 text-sky-300">
                  End gallery
                </span>
              )}
            </div>
            {selectedItem.placement === "cover" && (
              <p className="text-xs text-white/40 leading-relaxed">
                Featured images appear in the article hero header. Use a different image to insert
                into the story body.
              </p>
            )}
          </aside>
        )}
      </div>

      {/* Footer actions */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-[#1a1d26] shrink-0">
        <div className="flex items-center gap-2 text-xs text-white/40">
          {multiSelect.length === 2 ?
            <span className="text-brand-400 font-medium">
              Two images selected — ready for side-by-side row
            </span>
          : multiSelect.length === 1 ?
            <span>Tip: select two images for a side-by-side row</span>
          : <span>{items.length} / {maxImages} images</span>
          }
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          {selected != null && (
            <>
              <button
                type="button"
                onClick={() => {
                  onSetCover(selected);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                <Star className="w-4 h-4" />
                Set featured
              </button>
              {selectedItem?.placement !== "cover" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSetGallery(selected);
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                  >
                    End gallery
                  </button>
                  <button
                    type="button"
                    onClick={handleInsert}
                    disabled={selectedItem?.inStory}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-40"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Insert into post
                  </button>
                </>
              )}
            </>
          )}
          {multiSelect.length === 2 && (
            <button
              type="button"
              onClick={handleInsertRow}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              <Columns2 className="w-4 h-4" />
              Insert row
            </button>
          )}
        </div>
      </footer>
    </AdminFullScreenOverlay>
  );
}
