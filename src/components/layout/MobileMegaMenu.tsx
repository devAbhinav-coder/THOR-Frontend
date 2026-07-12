"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MegaMenuCategory } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  categories: MegaMenuCategory[];
  onClose: () => void;
};

export default function MobileMegaMenu({ categories, onClose }: Props) {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  const toggleCategory = (catId: string) => {
    setExpandedCatId((prev) => (prev === catId ? null : catId));
  };

  return (
    <div>
      <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c5a059]">
        Shop by Category
      </p>
      <div className="space-y-1">
        <Link
          onClick={onClose}
          href="/shop/collections"
          className="block border-l-2 border-transparent px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-[#c5a059] hover:bg-navy-900 hover:text-[#c5a059]"
        >
          All Sarees
        </Link>
        {categories.map((cat) => {
          const hasSub = cat.subcategories && cat.subcategories.length > 0;
          const isExpanded = expandedCatId === cat._id;

          return (
            <div key={cat._id} className="flex flex-col">
              <div className="flex items-center justify-between group px-4 py-2.5 border-l-2 border-transparent hover:border-[#c5a059] hover:bg-navy-900 transition-colors">
                <Link
                  onClick={onClose}
                  href={`/shop/collections/${encodeURIComponent(cat.slug)}`}
                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 group-hover:text-[#c5a059] flex-1"
                >
                  {cat.name}
                </Link>
                {hasSub && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat._id)}
                    className="p-1 -mr-2 text-white/50 hover:text-[#c5a059] transition-colors"
                    aria-label={`Toggle ${cat.name} subcategories`}
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              {hasSub && (
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out pl-6",
                    isExpanded ? "max-h-96 opacity-100 mt-1 mb-2" : "max-h-0 opacity-0"
                  )}
                >
                  <ul className="flex flex-col space-y-1 border-l border-white/10 ml-2 pl-3">
                    {cat.subcategories.map((sub) => (
                      <li key={`${cat.slug}-${sub.slug}`}>
                        <Link
                          onClick={onClose}
                          href={`/shop/collections/${encodeURIComponent(cat.slug)}/${encodeURIComponent(sub.slug)}`}
                          className="flex items-center text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white py-1.5 transition-colors group"
                        >
                          <ChevronRight className="w-3 h-3 mr-1 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#c5a059]" />
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        onClick={onClose}
                        href={`/shop/collections/${encodeURIComponent(cat.slug)}`}
                        className="flex items-center text-[10px] uppercase tracking-[0.1em] text-[#c5a059] py-1.5 transition-colors"
                      >
                        View all {cat.name}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
