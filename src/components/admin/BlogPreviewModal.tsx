"use client";

import { useEffect, useState } from "react";
import { X, Monitor, Smartphone, Tablet } from "lucide-react";
import type { BlogImage } from "@/types";
import BlogPreviewFrame from "./BlogPreviewFrame";
import AdminFullScreenOverlay, { overlayScrollClass } from "./AdminFullScreenOverlay";

export type PreviewViewport = "desktop" | "tablet" | "mobile";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  images: BlogImage[];
  articleTemplate?: string;
};

const VIEWPORTS: { id: PreviewViewport; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "max-w-4xl" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "max-w-[768px]" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "max-w-[390px]" },
];

export default function BlogPreviewModal({
  open,
  onClose,
  title,
  slug,
  content,
  excerpt,
  category,
  tags,
  images,
  articleTemplate = "classic",
}: Props) {
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");

  useEffect(() => {
    if (!open) return;
    setViewport("desktop");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const active = VIEWPORTS.find((v) => v.id === viewport)!;

  return (
    <AdminFullScreenOverlay
      open={open}
      className="bg-[#0a0c10]/98 backdrop-blur-md"
    >
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#0a0c10]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Live Preview
          </h2>
          <p className="text-xs text-white/50 mt-0.5 truncate max-w-[240px] sm:max-w-none">
            {title || "Untitled Story"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            {VIEWPORTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewport(id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  viewport === id ?
                    "bg-white text-gray-900"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div
          className={`w-full h-full ${active.width} flex flex-col max-h-full ${
            viewport === "mobile" ?
              "rounded-[2rem] border-[8px] border-gray-800 shadow-2xl bg-gray-800"
            : "rounded-2xl shadow-2xl overflow-hidden"
          }`}
        >
          {viewport === "mobile" && (
            <div className="h-7 bg-gray-800 flex items-center justify-center shrink-0 rounded-t-[1.4rem]">
              <div className="w-20 h-1 rounded-full bg-gray-600" />
            </div>
          )}
          <div className={`flex-1 min-h-0 ${overlayScrollClass} bg-[#fcfbf7] ${viewport === "mobile" ? "rounded-b-[1.4rem]" : ""}`}>
            <BlogPreviewFrame
              title={title}
              slug={slug}
              content={content}
              excerpt={excerpt}
              category={category}
              tags={tags}
              images={images}
              articleTemplate={articleTemplate}
              compact={viewport === "mobile"}
            />
          </div>
        </div>
      </div>
    </AdminFullScreenOverlay>
  );
}
