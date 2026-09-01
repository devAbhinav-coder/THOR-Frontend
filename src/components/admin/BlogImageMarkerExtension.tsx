"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { GripVertical, ImageIcon, LayoutGrid, Trash2, Star } from "lucide-react";
import { layoutLabel } from "@/lib/blogGridLayouts";
import type { BlogImageLayout } from "@/types";

function previewImageClass(layout: BlogImageLayout): string {
  switch (layout) {
    case "hero":
    case "wide":
      return "w-full aspect-[16/9] max-h-[360px] object-cover";
    case "portrait":
      return "w-full max-w-sm mx-auto aspect-[4/5] max-h-[400px] object-cover";
    case "square":
      return "w-full max-w-md mx-auto aspect-square max-h-[360px] object-cover";
    case "split":
      return "w-full aspect-[16/9] max-h-[280px] object-cover";
    default:
      return "w-full aspect-[16/10] max-h-[360px] object-cover";
  }
}

function ImageMarkerView({ node, selected, deleteNode, editor }: NodeViewProps) {
  const type = node.attrs.markerType as string;
  const index = node.attrs.index as number;
  const indices = String(node.attrs.indices || "");
  const previewUrl = node.attrs.previewUrl as string;
  const previewUrls = String(node.attrs.previewUrls || "")
    .split("|")
    .filter(Boolean);
  const caption = node.attrs.caption as string;
  const layout = (node.attrs.layout as BlogImageLayout) || "inline";
  const isCover = node.attrs.placement === "cover";

  if (type === "row") {
    const idxList = indices.split(",").filter(Boolean);
    const layoutList = String(node.attrs.layouts || "")
      .split(",")
      .filter(Boolean);
    return (
      <NodeViewWrapper className="blog-wp-image-block my-6">
        <div
          className={`relative rounded-lg overflow-hidden bg-white shadow-md ring-1 ring-black/5 transition-shadow ${
            selected ? "ring-2 ring-brand-500 shadow-lg" : ""
          }`}
          contentEditable={false}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-xs">
            <GripVertical className="w-4 h-4 opacity-50 cursor-grab" />
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="font-semibold flex-1">
              Side-by-side · {idxList.map((n, i) => {
                const num = Number(n);
                const lay = (layoutList[i] as BlogImageLayout) || "inline";
                return `#${num + 1} (${layoutLabel(lay).split(" ")[0]})`;
              }).join(" & ")}
            </span>
            <button
              type="button"
              onClick={() => {
                deleteNode();
                editor?.commands.focus();
              }}
              className="p-1 hover:bg-white/20 rounded"
              title="Remove row from story"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {previewUrls.length > 0 ?
            <div className="grid grid-cols-2 gap-0.5 bg-gray-100">
              {previewUrls.map((url, i) => {
                const lay = (layoutList[i] as BlogImageLayout) || "inline";
                const aspect =
                  lay === "portrait" ? "aspect-[4/5]"
                  : lay === "square" || lay === "split" ? "aspect-square"
                  : "aspect-[4/5]";
                return (
                  <div key={i} className={`relative ${aspect}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          : <div className="py-10 px-4 text-center text-sm text-gray-500 bg-gray-50">
              Upload images in the Media panel →
            </div>
          }
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="blog-wp-image-block my-6">
      <figure
        className={`relative rounded-lg overflow-hidden bg-white shadow-md ring-1 ring-black/5 transition-shadow ${
          selected ? "ring-2 ring-brand-500 shadow-lg" : ""
        }`}
        contentEditable={false}
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-xs">
          <GripVertical className="w-4 h-4 opacity-50 cursor-grab shrink-0" />
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span className="font-semibold flex-1 truncate">
            {isCover ?
              "Featured cover (header only)"
            : `Image #${index + 1} · ${layoutLabel(layout)}`}
          </span>
          {isCover ?
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          : null}
          <button
            type="button"
            onClick={() => {
              deleteNode();
              editor?.commands.focus();
            }}
            className="p-1 hover:bg-white/20 rounded shrink-0"
            title="Remove from story"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {previewUrl ?
          layout === "split" ?
            <div className="grid grid-cols-1 sm:grid-cols-2 bg-gray-100">
              <div className="relative min-h-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={caption || `Image ${index + 1}`}
                  className="w-full h-full min-h-[200px] object-cover block"
                />
              </div>
              <div className="flex flex-col justify-center p-6 bg-gray-900 text-white min-h-[160px]">
                <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Split layout</p>
                <p className="text-sm italic leading-relaxed">
                  {caption || "Add a caption in Media panel for the text side"}
                </p>
              </div>
            </div>
          : <div className="relative w-full bg-gray-100 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={caption || `Image ${index + 1}`}
                className={`block ${previewImageClass(layout)}`}
              />
            </div>
        : <div className="flex flex-col items-center justify-center py-14 px-6 bg-gradient-to-b from-gray-50 to-gray-100 text-gray-500">
            <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Image #{index + 1} — upload in Media panel</p>
          </div>
        }
        {caption ?
          <figcaption className="px-4 py-2.5 text-sm text-gray-600 italic border-t border-gray-100 bg-gray-50/80">
            {caption}
          </figcaption>
        : null}
      </figure>
    </NodeViewWrapper>
  );
}

export const BlogImageMarker = Node.create({
  name: "blogImageMarker",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      markerType: { default: "image" },
      index: { default: 0 },
      indices: { default: "" },
      previewUrl: { default: "" },
      previewUrls: { default: "" },
      layouts: { default: "" },
      caption: { default: "" },
      layout: { default: "inline" },
      placement: { default: "article" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-marker"]',
        getAttrs: (el) => {
          if (typeof el === "string") return false;
          const element = el as HTMLElement;
          return {
            markerType: element.getAttribute("data-marker-type") || "image",
            index: Number(element.getAttribute("data-index") || 0),
            indices: element.getAttribute("data-indices") || "",
            previewUrl: element.getAttribute("data-preview-url") || "",
            previewUrls: element.getAttribute("data-preview-urls") || "",
            layouts: element.getAttribute("data-layouts") || "",
            caption: element.getAttribute("data-caption") || "",
            layout: element.getAttribute("data-layout") || "inline",
            placement: element.getAttribute("data-placement") || "article",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "image-marker",
        "data-marker-type": node.attrs.markerType,
        "data-index": String(node.attrs.index),
        "data-indices": node.attrs.indices || "",
        "data-layout": node.attrs.layout || "inline",
        class: "blog-editor-image-marker",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageMarkerView);
  },
});
