"use client";

import Image from "next/image";
import Link from "next/link";
import { Category, SubCategory } from "@/types";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";

interface SubcategoryCardsProps {
  category: Category;
  subcategories: SubCategory[];
}

export default function SubcategoryCards({ category, subcategories }: SubcategoryCardsProps) {
  if (!subcategories || subcategories.length === 0) return null;

  const sortedSubcategories = [...subcategories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="w-full mb-3 sm:mb-4">
      <div
        {...horizontalScrollSurfaceProps}
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-hide sm:gap-4 ${horizontalScrollSurfaceClassName}`}
      >
        {sortedSubcategories.map((sub) => (
          <Link
            key={sub._id}
            href={`/shop/collections/${encodeURIComponent(category.slug)}/${encodeURIComponent(sub.slug)}`}
            className="group relative block aspect-[4/5] w-[140px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#c5a059]/30 bg-rose-50 shadow-sm transition-all hover:border-[#c5a059] hover:shadow-md sm:w-[180px] lg:w-[200px]"
          >
            <Image
              src={sub.image || "/placeholder-collection.png"}
              alt={sub.name}
              fill
              className="card-hover-zoom object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 160px, 200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
              <span className="text-white font-medium text-sm sm:text-base tracking-wide drop-shadow-sm group-hover:text-[#c5a059] transition-colors text-center">
                {sub.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
