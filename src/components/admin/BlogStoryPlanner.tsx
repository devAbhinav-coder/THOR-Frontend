"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ImageIcon,
  GalleryHorizontalEnd,
  X,
  Rows2,
  CheckCircle2,
  Newspaper,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import type { BlogImageLayout, BlogImagePlacement } from "@/types";
import { layoutLabel } from "@/lib/blogGridLayouts";
import type { GalleryRow } from "./BlogImageGalleryEditor";
import {
  buildStorySectionViews,
  clearImageFromContent,
  contentHasRowPair,
  contentToPlannerLines,
  indicesUsedInStory,
  insertImageAboveSection,
  insertImageBelowHeading,
  insertImageBelowSection,
  insertRowBelowSection,
  addPartnerToImageLine,
  imageRowPartner,
  removePlannerLine,
  type PlacedItemView,
} from "@/lib/blogStoryPlanner";

type Props = {
  rows: GalleryRow[];
  onRowsChange: (rows: GalleryRow[]) => void;
  content: string;
  onContentChange: (content: string) => void;
  title?: string;
  excerpt?: string;
};

const DRAG_MIME = "application/x-blog-image-index";

function rowUrl(row: GalleryRow | undefined): string | null {
  if (!row) return null;
  const url = row.kind === "existing" ? row.url : row.preview;
  return url?.trim() ? url : null;
}

function ThumbPreview({
  url,
  className = "w-full h-full object-cover",
  boxClassName = "w-10 h-10 rounded overflow-hidden shrink-0 bg-gray-200",
}: {
  url: string | null;
  className?: string;
  boxClassName?: string;
}) {
  return (
    <div className={`${boxClassName} flex items-center justify-center`}>
      {url ?
        <img src={url} alt="" className={className} />
      : <ImageIcon className="w-4 h-4 text-gray-400" />}
    </div>
  );
}

function applyPlacement(
  rows: GalleryRow[],
  index: number,
  placement: BlogImagePlacement,
  layout?: BlogImageLayout,
): GalleryRow[] {
  return rows.map((row, i) => {
    if (i === index) {
      return { ...row, placement, ...(layout ? { layout } : {}) } as GalleryRow;
    }
    if (placement === "cover" && row.placement === "cover") {
      return { ...row, placement: "article" as const };
    }
    return row;
  });
}

function readDragIndex(e: React.DragEvent): number | null {
  const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

function DropSlot({
  label,
  accent,
  onDrop,
  dragging,
}: {
  label: string;
  accent: "emerald" | "violet";
  onDrop: (index: number) => void;
  dragging: boolean;
}) {
  const [over, setOver] = useState(false);
  const colors =
    accent === "violet" ?
      { ring: "ring-violet-400", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-800" }
    : { ring: "ring-emerald-400", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800" };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const idx = readDragIndex(e);
        if (idx === null) return;
        onDrop(idx);
      }}
      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 border-dashed transition-all ${
        over ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}` : "border-gray-200 bg-gray-50/80"
      } ${dragging ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
    >
      <ChevronDown className={`w-3.5 h-3.5 ${over ? colors.text : "text-gray-400"}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wide ${over ? colors.text : "text-gray-500"}`}>
        {over ? "Release here" : label}
      </span>
    </div>
  );
}

function SplitPartnerSlot({
  firstIndex,
  dragging,
  onAddPartner,
}: {
  firstIndex: number;
  dragging: boolean;
  onAddPartner: (partnerIndex: number) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const idx = readDragIndex(e);
        if (idx === null) return;
        onAddPartner(idx);
      }}
      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 border-dashed transition-all ${
        over ?
          "border-violet-400 bg-violet-50 ring-2 ring-violet-300"
        : "border-violet-200 bg-violet-50/60"
      } ${dragging ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
    >
      <Rows2 className={`w-3.5 h-3.5 ${over ? "text-violet-700" : "text-violet-500"}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wide ${over ? "text-violet-800" : "text-violet-700"}`}>
        {over ? "Release 2nd photo" : `Add 2nd photo for split pair with #${firstIndex}`}
      </span>
    </div>
  );
}

function PlacedImage({
  item,
  rows,
  content,
  draggingIndex,
  onRemove,
  onAddSplitPartner,
}: {
  item: PlacedItemView;
  rows: GalleryRow[];
  content: string;
  draggingIndex: number | null;
  onRemove: () => void;
  onAddSplitPartner: (firstIndex: number, partnerIndex: number) => void;
}) {
  const line = item.line;
  if (line.type === "image") {
    const layout = rows[line.index]?.layout || "inline";
    const needsPartner = layout === "split" && imageRowPartner(content, line.index) === null;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-100/80 border border-emerald-200">
          <ThumbPreview url={rowUrl(rows[line.index])} />
          <span className="text-[10px] font-bold text-emerald-900">
            #{line.index} · {layoutLabel(layout)}
          </span>
          <button type="button" onClick={onRemove} className="ml-auto p-1 text-emerald-700 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {needsPartner && (
          <SplitPartnerSlot
            firstIndex={line.index}
            dragging={draggingIndex !== null}
            onAddPartner={(partnerIdx) => onAddSplitPartner(line.index, partnerIdx)}
          />
        )}
      </div>
    );
  }

  if (line.type === "row") {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-100/80 border border-violet-200">
        <Rows2 className="w-4 h-4 text-violet-600 shrink-0" />
        <div className="flex gap-1">
          {line.indices.map((i: number) => (
            <ThumbPreview
              key={i}
              url={rowUrl(rows[i])}
              boxClassName="w-9 h-9 rounded overflow-hidden shrink-0 bg-violet-100"
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-violet-900">
          #{line.indices.join(" · #")} · Split Row
        </span>
        <button type="button" onClick={onRemove} className="ml-auto p-1 text-violet-700 hover:text-red-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
}

function DraggableThumb({
  row,
  index,
  onDragStart,
  onDragEnd,
}: {
  row: GalleryRow;
  index: number;
  onDragStart: (i: number) => void;
  onDragEnd: () => void;
}) {
  const url = rowUrl(row);
  if (!url) return null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData(DRAG_MIME, String(index));
        e.dataTransfer.setData("text/plain", String(index));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd();
      }}
      className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-brand-400 shrink-0"
    >
      <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center font-bold py-0.5">
        #{index}
      </span>
    </div>
  );
}

export default function BlogStoryPlanner({
  rows,
  onRowsChange,
  content,
  onContentChange,
  title = "",
  excerpt = "",
}: Props) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [pairPending, setPairPending] = useState<{
    sectionIndex: number;
    firstIndex: number;
  } | null>(null);

  const usedInStory = useMemo(() => indicesUsedInStory(content), [content]);
  const sections = useMemo(() => buildStorySectionViews(content), [content]);
  const coverIndex = rows.findIndex((r) => r.placement === "cover");
  const galleryIndices = rows.map((_, i) => i).filter((i) => rows[i].placement === "gallery");
  const coverUrl = coverIndex >= 0 ? rowUrl(rows[coverIndex]) : null;

  const sync = useCallback(
    (nextContent: string, updates: Array<{ index: number; placement: BlogImagePlacement; layout?: BlogImageLayout }>) => {
      onContentChange(nextContent);
      let next = rows;
      for (const u of updates) {
        next = applyPlacement(next, u.index, u.placement, u.layout);
      }
      onRowsChange(next);
    },
    [rows, onContentChange, onRowsChange],
  );

  const moveToCover = (imageIndex: number) => {
    sync(clearImageFromContent(content, imageIndex), [
      { index: imageIndex, placement: "cover", layout: "hero" },
    ]);
    toast.success(`#${imageIndex} → Cover & listing photo`);
  };

  const moveToGallery = (imageIndex: number) => {
    sync(clearImageFromContent(content, imageIndex), [{ index: imageIndex, placement: "gallery" }]);
    toast.success(`#${imageIndex} → End gallery`);
  };

  const moveAbove = (imageIndex: number, sectionIndex: number) => {
    sync(insertImageAboveSection(content, imageIndex, sectionIndex), [
      { index: imageIndex, placement: "article" },
    ]);
    setPairPending(null);
    toast.success(`#${imageIndex} placed above section`);
  };

  const moveBelowHeading = (imageIndex: number, sectionIndex: number) => {
    sync(insertImageBelowHeading(content, imageIndex, sectionIndex), [
      { index: imageIndex, placement: "article" },
    ]);
    setPairPending(null);
    toast.success(`#${imageIndex} placed below heading`);
  };

  const moveBelowSection = (imageIndex: number, sectionIndex: number) => {
    sync(insertImageBelowSection(content, imageIndex, sectionIndex), [
      { index: imageIndex, placement: "article" },
    ]);
    setPairPending(null);
    toast.success(`#${imageIndex} placed below section`);
  };

  const movePair = (a: number, b: number, sectionIndex: number) => {
    if (a === b) {
      toast.error("Use two different photos");
      return;
    }
    if (contentHasRowPair(content, a, b)) {
      toast.error("This pair is already placed");
      return;
    }
    sync(insertRowBelowSection(content, [a, b], sectionIndex), [
      { index: a, placement: "article", layout: "split" },
      { index: b, placement: "article", layout: "split" },
    ]);
    setPairPending(null);
    toast.success(`#${a} & #${b} side by side`);
  };

  const handleAddSplitPartner = (firstIndex: number, partnerIndex: number) => {
    if (firstIndex === partnerIndex) {
      toast.error("Use two different photos");
      return;
    }
    if (imageRowPartner(content, firstIndex) !== null) {
      toast.error("Split pair already has a partner");
      return;
    }
    sync(addPartnerToImageLine(content, firstIndex, partnerIndex), [
      { index: firstIndex, placement: "article", layout: "split" },
      { index: partnerIndex, placement: "article", layout: "split" },
    ]);
    setPairPending(null);
    toast.success(`Split pair: #${firstIndex} & #${partnerIndex}`);
  };

  const handlePairDrop = (sectionIndex: number, imageIndex: number) => {
    if (pairPending?.sectionIndex === sectionIndex) {
      movePair(pairPending.firstIndex, imageIndex, sectionIndex);
      return;
    }
    setPairPending({ sectionIndex, firstIndex: imageIndex });
    toast("Drop 2nd photo on the same purple slot", { icon: "2️⃣" });
  };

  const removeLine = (lineIndex: number) => {
    const lines = contentToPlannerLines(content);
    const line = lines[lineIndex];
    const next = removePlannerLine(content, lineIndex);
    onContentChange(next);

    if (line?.type === "image") {
      if (!indicesUsedInStory(next).has(line.index)) {
        onRowsChange(applyPlacement(rows, line.index, "article"));
      }
    }
    if (line?.type === "row") {
      let nextRows = rows;
      for (const i of line.indices) {
        if (!indicesUsedInStory(next).has(i)) {
          nextRows = applyPlacement(nextRows, i, "article");
        }
      }
      onRowsChange(nextRows);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
        Upload photos first
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-900">Visual story planner</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Above · below heading · below section · side-by-side pair — per heading block.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Photo strip */}
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          {rows.map((row, i) => (
            <DraggableThumb
              key={row.kind === "existing" ? row.publicId : row.preview}
              row={row}
              index={i}
              onDragStart={setDraggingIndex}
              onDragEnd={() => setDraggingIndex(null)}
            />
          ))}
        </div>
        {draggingIndex !== null && (
          <p className="text-[10px] font-semibold text-brand-700 -mt-2">
            Dragging #{draggingIndex} — drop on a slot below
          </p>
        )}

        {/* Listing card + cover */}
        <div
          className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-4"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const idx = readDragIndex(e);
            if (idx !== null) moveToCover(idx);
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold text-amber-900 uppercase">
              Cover + listing card photo
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg overflow-hidden border border-amber-200 bg-white shadow-sm">
              <div className="relative aspect-[16/9] bg-gray-100">
                {coverUrl ?
                  <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-xs text-amber-600/70">
                    Drop cover photo
                  </div>
                }
              </div>
              <p className="text-[10px] font-bold text-amber-900 px-2 py-1.5 border-t border-amber-100">
                Blog listing + article hero
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Listing preview</p>
              <p className="text-sm font-serif font-bold text-gray-900 line-clamp-2">
                {title || "Your title"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-3">
                {excerpt || "Excerpt text appears on blog cards…"}
              </p>
              {coverIndex >= 0 && (
                <p className="text-[10px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Using image #{coverIndex}
                </p>
              )}
            </div>
          </div>
          {coverIndex >= 0 && (
            <button
              type="button"
              onClick={() => onRowsChange(applyPlacement(rows, coverIndex, "article"))}
              className="mt-2 text-[10px] font-bold uppercase text-red-600 hover:underline"
            >
              Remove cover
            </button>
          )}
        </div>

        {/* Story sections */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-800 uppercase flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Article sections
          </p>

          {sections.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
              Write content with headings (H2, H3…) in Content Body — sections will appear here for photo placement.
            </div>
          ) : (
            sections.map((sec) => (
              <div
                key={`sec-${sec.sectionIndex}`}
                className="rounded-xl border border-gray-200 overflow-hidden bg-white"
              >
                <div className="p-3 space-y-2">
                  <DropSlot
                    label="① Above this section"
                    accent="emerald"
                    dragging={draggingIndex !== null}
                    onDrop={(idx) => moveAbove(idx, sec.sectionIndex)}
                  />

                  {sec.beforeItems.map((item) => (
                    <PlacedImage
                      key={`before-${item.lineIndex}`}
                      item={item}
                      rows={rows}
                      content={content}
                      draggingIndex={draggingIndex}
                      onRemove={() => removeLine(item.lineIndex)}
                      onAddSplitPartner={handleAddSplitPartner}
                    />
                  ))}

                  <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm font-serif font-bold text-gray-900 leading-snug">
                      {sec.heading || `Section ${sec.sectionIndex + 1}`}
                    </p>
                  </div>

                  <DropSlot
                    label="② Below heading, before paragraph"
                    accent="emerald"
                    dragging={draggingIndex !== null}
                    onDrop={(idx) => moveBelowHeading(idx, sec.sectionIndex)}
                  />

                  {sec.headingSlotItems.map((item) => (
                    <PlacedImage
                      key={`head-${item.lineIndex}`}
                      item={item}
                      rows={rows}
                      content={content}
                      draggingIndex={draggingIndex}
                      onRemove={() => removeLine(item.lineIndex)}
                      onAddSplitPartner={handleAddSplitPartner}
                    />
                  ))}

                  {sec.bodyPreview && (
                    <p className="text-[11px] text-gray-500 leading-relaxed px-2 py-2 bg-gray-50 rounded-lg border border-gray-100">
                      {sec.bodyPreview}
                    </p>
                  )}

                  {sec.afterItems.map((item) => (
                    <PlacedImage
                      key={`after-${item.lineIndex}`}
                      item={item}
                      rows={rows}
                      content={content}
                      draggingIndex={draggingIndex}
                      onRemove={() => removeLine(item.lineIndex)}
                      onAddSplitPartner={handleAddSplitPartner}
                    />
                  ))}

                  <DropSlot
                    label="③ Below section (after paragraph)"
                    accent="emerald"
                    dragging={draggingIndex !== null}
                    onDrop={(idx) => moveBelowSection(idx, sec.sectionIndex)}
                  />

                  <DropSlot
                    label={
                      pairPending?.sectionIndex === sec.sectionIndex ?
                        `④ Drop 2nd photo (pair with #${pairPending.firstIndex})`
                      : "④ Side-by-side pair (drop 2 photos)"
                    }
                    accent="violet"
                    dragging={draggingIndex !== null || pairPending !== null}
                    onDrop={(idx) => handlePairDrop(sec.sectionIndex, idx)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* End gallery */}
        <div
          className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const idx = readDragIndex(e);
            if (idx !== null) moveToGallery(idx);
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <GalleryHorizontalEnd className="w-4 h-4 text-sky-700" />
            <span className="text-xs font-bold text-sky-900 uppercase">End gallery (optional)</span>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[3rem]">
            {galleryIndices.length === 0 && (
              <p className="text-xs text-sky-700/70 self-center">Extra photos after article ends</p>
            )}
            {galleryIndices.map((i) => (
              <div key={i} className="relative group">
                <ThumbPreview
                  url={rowUrl(rows[i])}
                  boxClassName="w-14 h-14 rounded-lg overflow-hidden border border-sky-200 bg-sky-100"
                />
                <button
                  type="button"
                  onClick={() => onRowsChange(applyPlacement(rows, i, "article"))}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {pairPending && (
          <button
            type="button"
            onClick={() => setPairPending(null)}
            className="text-xs text-gray-500 hover:text-red-600 w-full text-center py-1"
          >
            Cancel side-by-side pairing
          </button>
        )}
      </div>
    </div>
  );
}
