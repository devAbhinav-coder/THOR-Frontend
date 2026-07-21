"use client";

import { Sparkles, X } from "lucide-react";
import {
  parseSearchQueryIntent,
  type ParsedSearchIntent,
} from "@/lib/searchQueryParser";
import { cn, formatPrice } from "@/lib/utils";
import type { ShopFilters } from "@/lib/shopFilters";

type Props = {
  search: string;
  filters: ShopFilters;
  searchIntent?: ParsedSearchIntent | null;
  onApplySearch: (query: string) => void;
  onApplyColor: (color: string) => void;
  onApplyCategory: (category: string) => void;
  onApplyMaxPrice: (maxPrice: string) => void;
  onClearSearch: () => void;
  className?: string;
};

function titleCase(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default function ShopSearchIntentChips({
  search,
  filters,
  searchIntent,
  onApplySearch,
  onApplyColor,
  onApplyCategory,
  onApplyMaxPrice,
  onClearSearch,
  className,
}: Props) {
  const intent = searchIntent ?? parseSearchQueryIntent(search);
  if (!search.trim()) return null;

  const chips: Array<{
    key: string;
    label: string;
    onClick?: () => void;
    applied?: boolean;
  }> = [];

  if (
    intent.didYouMean &&
    intent.didYouMean.trim().toLowerCase() !== search.trim().toLowerCase()
  ) {
    chips.push({
      key: "did-you-mean",
      label: `Did you mean: ${intent.didYouMean}`,
      onClick: () => onApplySearch(intent.didYouMean!),
    });
  }

  for (const color of intent.colors) {
    const label = titleCase(color);
    const applied = filters.colors.some(
      (c) => c.toLowerCase() === color.toLowerCase(),
    );
    chips.push({
      key: `color-${color}`,
      label: applied ? `${label} color` : `Add ${label}`,
      onClick: applied ? undefined : () => onApplyColor(label),
      applied,
    });
  }

  for (const category of intent.categories) {
    const label = titleCase(category);
    const applied = filters.categories.some(
      (c) => c.toLowerCase() === category.toLowerCase(),
    );
    chips.push({
      key: `cat-${category}`,
      label: applied ? label : `Category: ${label}`,
      onClick: applied ? undefined : () => onApplyCategory(label),
      applied,
    });
  }

  for (const color of intent.colors) {
    chips.push({
      key: `color-${color}`,
      label: titleCase(color),
      applied: true,
    });
  }

  for (const subcategory of intent.subcategories) {
    chips.push({
      key: `subcat-${subcategory}`,
      label: titleCase(subcategory),
      applied: true,
    });
  }

  for (const tag of intent.tags) {
    if (intent.subcategories.includes(tag)) continue;
    chips.push({
      key: `tag-${tag}`,
      label: `#${titleCase(tag)}`,
      applied: true,
    });
  }

  if (intent.maxPrice !== undefined) {
    const maxStr = String(intent.maxPrice);
    const applied = filters.maxPrice === maxStr;
    chips.push({
      key: "max-price",
      label:
        applied ?
          `Under ${formatPrice(intent.maxPrice)}`
        : `Under ${formatPrice(intent.maxPrice)} — apply`,
      onClick: applied ? undefined : () => onApplyMaxPrice(maxStr),
      applied,
    });
  }

  if (!chips.length) return null;

  return (
    <div className={cn("mt-4 flex flex-wrap items-center gap-2", className)}>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
        <Sparkles className="h-3 w-3 text-[#c5a059]" aria-hidden />
        Smart search
      </span>
      {chips.map((chip) =>
        chip.onClick ?
          <button
            key={chip.key}
            type="button"
            onClick={chip.onClick}
            className="rounded-full border border-[#c5a059]/35 bg-[#fff8eb] px-3 py-1 text-[11px] font-medium text-[#1a2b48] transition-colors hover:border-[#c5a059] hover:bg-white"
          >
            {chip.label}
          </button>
        : <span
            key={chip.key}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600"
          >
            {chip.label}
          </span>,
      )}
      <button
        type="button"
        onClick={onClearSearch}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-[#c5a059]"
      >
        <X className="h-3 w-3" aria-hidden />
        Clear search
      </button>
    </div>
  );
}
