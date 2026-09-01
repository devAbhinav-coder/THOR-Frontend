"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, X } from "lucide-react";
import { resolvePdpSizeGuideContent, type PdpSizeGuideData } from "./pdpSizeGuideContent";

type PdpSizeGuideModalProps = {
  open: boolean;
  onClose: () => void;
  category?: string;
  productName?: string;
  sizes: string[];
  sizeGuide?: PdpSizeGuideData;
};

export function PdpSizeGuideModal({
  open,
  onClose,
  category,
  productName,
  sizes,
  sizeGuide,
}: PdpSizeGuideModalProps) {
  const [mounted, setMounted] = useState(false);
  const content = resolvePdpSizeGuideContent({
    sizeGuide,
    category,
    productName,
    sizes,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted || !content) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-navy-900/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      onClick={onClose}
    >
      <div
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#c5a059]/20 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#faf8f4] text-[#c5a059] ring-1 ring-[#c5a059]/25">
              <Ruler className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy-900">
                {content.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {content.intro}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close size guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                <th className="pb-2 pr-3">Size</th>
                <th className="pb-2">Fit notes</th>
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row) => (
                <tr
                  key={row.size}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-2.5 pr-3 align-top font-semibold text-navy-900">
                    {row.size}
                  </td>
                  <td className="py-2.5 align-top text-xs leading-relaxed text-gray-600">
                    {row.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {content.tips.map((tip) => (
              <li
                key={tip}
                className="flex gap-2 text-xs leading-relaxed text-gray-600"
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#c5a059]"
                  aria-hidden
                />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
