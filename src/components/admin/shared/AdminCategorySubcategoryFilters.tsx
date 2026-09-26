"use client";

import type { Category, SubCategory } from "@/types";
import { subcategoriesForCategory } from "@/lib/adminCatalog";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type Props = {
  categories: Category[];
  allSubcategories: SubCategory[];
  categoryValue: string;
  subcategoryValue: string;
  onCategoryChange: (categoryName: string) => void;
  onSubcategoryChange: (subcategoryName: string) => void;
  className?: string;
};

const selectCls =
  "h-8 max-w-[7.25rem] min-w-[6.5rem] truncate px-2 rounded-lg border-0 bg-white text-[11px] font-semibold text-gray-700 focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm";

export default function AdminCategorySubcategoryFilters({
  categories,
  allSubcategories,
  categoryValue,
  subcategoryValue,
  onCategoryChange,
  onSubcategoryChange,
  className,
}: Props) {
  const selectedCategory = useMemo(
    () => categories.find((c) => c.name === categoryValue),
    [categories, categoryValue],
  );

  const subcategoryOptions = useMemo(
    () => subcategoriesForCategory(allSubcategories, selectedCategory),
    [allSubcategories, selectedCategory],
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50/90 p-0.5 shrink-0",
        className,
      )}
    >
      <select
        value={categoryValue}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectCls}
        aria-label='Filter by category'
        title={categoryValue || "All categories"}
      >
        <option value=''>All categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <span className='text-[10px] text-gray-300 select-none px-0.5' aria-hidden>
        /
      </span>
      <select
        value={subcategoryValue}
        onChange={(e) => onSubcategoryChange(e.target.value)}
        disabled={!categoryValue || subcategoryOptions.length === 0}
        className={cn(selectCls, "disabled:opacity-40 disabled:cursor-not-allowed")}
        aria-label='Filter by subcategory'
        title={
          subcategoryValue ||
          (!categoryValue ? "Select category first" : "All subcategories")
        }
      >
        <option value=''>
          {!categoryValue ?
            "Subcategory"
          : subcategoryOptions.length === 0 ?
            "None"
          : "All subs"}
        </option>
        {subcategoryOptions.map((s) => (
          <option key={s._id} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
