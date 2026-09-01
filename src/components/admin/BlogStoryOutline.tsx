"use client";

import { useMemo } from "react";
import { ImageIcon, X, AlignLeft } from "lucide-react";
import type { GalleryRow } from "./BlogImageGalleryEditor";
import { contentHasImageMarker } from "@/lib/blogImageMarkers";
import { clearImageFromContent } from "@/lib/blogStoryPlanner";

type Props = {
  rows: GalleryRow[];
  content: string;
  onContentChange: (content: string) => void;
  onInsertInStory?: (index: number) => void;
};

function extractSections(html: string): string[] {
  const titles: string[] = [];
  const re = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, "").trim();
    if (text) titles.push(text);
  }
  return titles;
}

export default function BlogStoryOutline({
  rows,
  content,
  onContentChange,
  onInsertInStory,
}: Props) {
  const sections = useMemo(() => extractSections(content), [content]);

  const placed = rows
    .map((row, index) => ({
      index,
      row,
      url: row.kind === "existing" ? row.url : row.preview,
      inStory: contentHasImageMarker(index, content),
    }))
    .filter((r) => r.inStory && r.row.placement !== "cover");

  const available = rows
    .map((row, index) => ({ index, row, url: row.kind === "existing" ? row.url : row.preview }))
    .filter((r) => r.row.placement !== "cover" && !contentHasImageMarker(r.index, content));

  const removeFromStory = (index: number) => {
    onContentChange(clearImageFromContent(content, index));
  };

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        Upload images first — then insert them via Add Media in the editor.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.length > 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
            Article sections
          </p>
          <ol className="space-y-2">
            {sections.map((title, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="line-clamp-2">{title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {placed.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            Images in story ({placed.length})
          </p>
          <div className="space-y-2">
            {placed.map(({ index, url }) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                  {url ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  : <ImageIcon className="w-5 h-5 m-auto text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Image #{index + 1}</p>
                  <p className="text-[10px] text-emerald-700">Placed in article body</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromStory(index)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove from story"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && onInsertInStory && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            Ready to insert ({available.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {available.map(({ index, url }) => (
              <button
                key={index}
                type="button"
                onClick={() => onInsertInStory(index)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {url ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  : <ImageIcon className="w-6 h-6 m-auto mt-[40%] text-gray-300" />}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-brand-700">
                  <AlignLeft className="w-3 h-3" />
                  Insert #{index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {placed.length === 0 && available.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">
          All images are assigned as featured cover or end gallery.
        </p>
      )}
    </div>
  );
}
