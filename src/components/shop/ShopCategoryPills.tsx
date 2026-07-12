"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { horizontalScrollSurfaceClassName, horizontalScrollSurfaceProps } from "@/lib/scrollSurface";

export interface CategoryPill {
  name: string;
  href: string;
  isActive: boolean;
}

interface ShopCategoryPillsProps {
  pills: CategoryPill[];
  className?: string;
}

export default function ShopCategoryPills({ pills, className }: ShopCategoryPillsProps) {
  if (!pills || pills.length === 0) return null;

  return (
    <div
      {...horizontalScrollSurfaceProps}
      className={cn(
        "flex min-w-0 items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide",
        horizontalScrollSurfaceClassName,
        className
      )}
    >
      {pills.map((pill) => (
        <Link
          key={pill.name}
          href={pill.href}
          scroll={false}
          className={cn(
            "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-xs font-medium tracking-wide transition-colors",
            pill.isActive
              ? "border-[#c5a059] bg-[#c5a059] text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#c5a059] hover:text-[#c5a059]"
          )}
        >
          {pill.name}
        </Link>
      ))}
    </div>
  );
}
