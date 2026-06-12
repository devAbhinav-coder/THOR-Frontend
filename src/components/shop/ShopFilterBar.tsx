"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, X, ArrowUpDown, Package } from "lucide-react";
import { FilterOptions } from "@/types";
import { cn } from "@/lib/utils";
import type { ShopFilters } from "@/lib/shopFilters";
import {
  isShopListFilterSelected,
  isShopCategoryFilterSelected,
  resolveShopPriceDraft,
  shopPriceDraftToFilterStrings,
} from "@/lib/shopFilters";
import ShopPriceRangeFilter from "@/components/shop/ShopPriceRangeFilter";

const shopFilterCheckboxClass =
  "h-4 w-4 shrink-0 rounded-none border-gray-300 accent-[#c5a059] text-[#c5a059] focus:ring-[#c5a059]";

const FILTER_CLOSE_DELAY_MS = 160;

const shopBarTextClass =
  "text-[10px] sm:text-[11px] uppercase tracking-[0.12em] leading-none";
const shopBarItemClass = cn(
  "inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap",
  shopBarTextClass,
);
const shopBarDividerClass =
  "hidden h-4 w-px shrink-0 self-center bg-[#c5a059]/30 sm:block";

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "-createdAt" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Price: Low to High", value: "price" },
  { label: "Curated Favorites", value: "-ratings.average" },
  { label: "Most Popular", value: "-ratings.count" },
] as const;

type Props = {
  filters: ShopFilters;
  filterOptions: FilterOptions | null;
  activeFilterCount: number;
  showClearFilters: boolean;
  isFilterOpen: boolean;
  onOpenFilter: () => void;
  onCloseFilter: () => void;
  onToggleFilter: () => void;
  onUpdateFilter: (key: string, value: string | number) => void;
  onClearFilters: () => void;
  onApplyPriceFilters: (minPrice: string, maxPrice: string) => void;
  quickFabrics: string[];
  productCountLabel: string;
};

function useHoverCapablePointer() {
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverCapable(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return hoverCapable;
}

export default function ShopFilterBar({
  filters,
  filterOptions,
  activeFilterCount,
  showClearFilters,
  isFilterOpen,
  onOpenFilter,
  onCloseFilter,
  onToggleFilter,
  onUpdateFilter,
  onClearFilters,
  onApplyPriceFilters,
  quickFabrics,
  productCountLabel,
}: Props) {
  const filterMenuId = useId();
  const hoverCapable = useHoverCapablePointer();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDismissedRef = useRef(false);
  const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);

  useEffect(() => {
    setDraftMinPrice(filters.minPrice);
    setDraftMaxPrice(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleFilterZoneEnter = () => {
    if (!hoverCapable) return;
    if (hoverDismissedRef.current) return;
    cancelCloseTimer();
    onOpenFilter();
  };

  const handleFilterZoneLeave = () => {
    if (!hoverCapable) return;
    hoverDismissedRef.current = false;
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      onCloseFilter();
      closeTimerRef.current = null;
    }, FILTER_CLOSE_DELAY_MS);
  };

  const handleFilterTriggerClick = () => {
    if (hoverCapable) {
      cancelCloseTimer();
      if (isFilterOpen) {
        hoverDismissedRef.current = true;
        onCloseFilter();
        return;
      }
      hoverDismissedRef.current = false;
      onOpenFilter();
      return;
    }
    onToggleFilter();
  };

  const handleApplyPriceFilters = () => {
    const { min, max } = resolveShopPriceDraft(draftMinPrice, draftMaxPrice);
    const { minPrice, maxPrice } = shopPriceDraftToFilterStrings(min, max);
    onApplyPriceFilters(minPrice, maxPrice);
  };

  return (
    <section
      className="sticky top-16 z-40 mb-10 border-y border-[#c5a059]/20 bg-white/95 backdrop-blur-sm sm:mb-12"
      aria-label="Product filters and sorting"
    >
      <div className="mx-auto flex max-w-7xl min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-4 sm:gap-x-4 sm:px-6 lg:px-8">
        <div
          className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8"
          onMouseEnter={handleFilterZoneEnter}
          onMouseLeave={handleFilterZoneLeave}
        >
          <button
            type="button"
            className={cn(
              shopBarItemClass,
              "gap-2 font-semibold text-navy-900 transition-all duration-300 hover:tracking-[0.16em]",
            )}
            onClick={handleFilterTriggerClick}
            aria-expanded={isFilterOpen}
            aria-controls={filterMenuId}
          >
            {isFilterOpen ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            )}
            {isFilterOpen ? "Close" : "Filter"}
            {activeFilterCount > 0 && !isFilterOpen ? (
              <span className="ml-0.5 text-[#c5a059]">
                ({activeFilterCount})
              </span>
            ) : null}
          </button>

          <div className={shopBarDividerClass} aria-hidden />

          <div className="hidden sm:flex min-w-0 flex-1 items-center gap-4 overflow-x-auto scrollbar-hide sm:gap-6">
            {quickFabrics.map((fabric) => (
              <button
                key={fabric}
                type="button"
                onClick={() => onUpdateFilter("fabrics", fabric)}
                className={cn(
                  shopBarItemClass,
                  "font-semibold transition-colors",
                  isShopListFilterSelected(filters.fabrics, fabric)
                    ? "text-[#c5a059]"
                    : "text-gray-500 hover:text-[#c5a059]",
                )}
              >
                {fabric}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
          {showClearFilters ? (
            <>
              <button
                type="button"
                onClick={onClearFilters}
                className={cn(
                  shopBarItemClass,
                  "font-semibold text-[#c5a059] transition-colors hover:text-brand-700",
                )}
              >
                <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Clear all filters</span>
                <span className="sm:hidden">Clear</span>
              </button>
              <span className={shopBarDividerClass} aria-hidden />
            </>
          ) : null}
          <span
            className={cn(
              shopBarItemClass,
              "font-medium text-gray-500",
            )}
          >
            <Package className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden sm:inline">{productCountLabel}</span>
            <span className="sm:hidden">{parseInt(productCountLabel) || 0}</span>
          </span>
          <span className={shopBarDividerClass} aria-hidden />
          <ShopSortDropdown
            value={filters.sort}
            onChange={(next) => onUpdateFilter("sort", next)}
            hoverCapable={hoverCapable}
          />
        </div>
      </div>

      <div
        id={filterMenuId}
        onMouseEnter={handleFilterZoneEnter}
        onMouseLeave={handleFilterZoneLeave}
        data-lenis-prevent="true"
        className={cn(
          "luxury-filter-transition overflow-x-hidden overflow-y-auto overscroll-contain border-t border-[#c5a059]/10 bg-white",
          isFilterOpen ? "open !max-h-[calc(100svh-280px)] sm:!max-h-[calc(100svh-200px)] lg:!max-h-[calc(100vh-120px)]" : "max-h-0 border-t-0",
        )}
      >
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-8">
              <FilterColumn title="Category">
                <ul className="space-y-2 text-sm">
                  {filterOptions?.categories.map((cat) => {
                    const selected = isShopCategoryFilterSelected(
                      filters.categories,
                      cat,
                    );
                    return (
                      <li key={cat}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 transition-colors",
                            selected ?
                              "font-medium text-[#c5a059]"
                            : "text-gray-600 hover:text-[#c5a059]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onUpdateFilter("categories", cat)}
                            className={shopFilterCheckboxClass}
                          />
                          {cat}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </FilterColumn>

              <FilterColumn title="Fabric">
                <ul className="space-y-2 text-sm">
                  {filterOptions?.fabrics.map((fabric) => {
                    const selected = isShopListFilterSelected(
                      filters.fabrics,
                      fabric,
                    );
                    return (
                      <li key={fabric}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 transition-colors",
                            selected ?
                              "font-medium text-[#c5a059]"
                            : "text-gray-600 hover:text-[#c5a059]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onUpdateFilter("fabrics", fabric)}
                            className={shopFilterCheckboxClass}
                          />
                          {fabric}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </FilterColumn>

              <FilterColumn title="Minimum Rating">
                <ul className="space-y-2 text-sm">
                  {[4, 3, 2, 1].map((r) => {
                    const selected = isShopListFilterSelected(
                      filters.ratings,
                      String(r),
                    );
                    return (
                      <li key={r}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 transition-colors",
                            selected ?
                              "font-medium text-[#c5a059]"
                            : "text-gray-600 hover:text-[#c5a059]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onUpdateFilter("ratings", String(r))}
                            className={shopFilterCheckboxClass}
                          />
                          {"★".repeat(r)} & above
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </FilterColumn>

              <FilterColumn title="Price Range" isCollapsibleOnMobile={false}>
                <div className="space-y-4">
                  <ShopPriceRangeFilter
                    minPrice={draftMinPrice}
                    maxPrice={draftMaxPrice}
                    onMinPriceChange={setDraftMinPrice}
                    onMaxPriceChange={setDraftMaxPrice}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPriceFilters}
                    className="w-full bg-[#c5a059] py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                  >
                    Apply Filters
                  </button>
                </div>
              </FilterColumn>
            </div>

      </div>
    </section>
  );
}

function ShopSortDropdown({
  value,
  onChange,
  hoverCapable,
}: {
  value: string;
  onChange: (value: string) => void;
  hoverCapable: boolean;
}) {
  const menuId = useId();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDismissedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel =
    SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? "Newest Arrivals";

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    cancelCloseTimer();
    setIsOpen(true);
  };

  const closeMenu = () => {
    cancelCloseTimer();
    setIsOpen(false);
  };

  const handleZoneEnter = () => {
    if (!hoverCapable) return;
    if (hoverDismissedRef.current) return;
    openMenu();
  };

  const handleZoneLeave = () => {
    if (!hoverCapable) return;
    hoverDismissedRef.current = false;
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, FILTER_CLOSE_DELAY_MS);
  };

  const handleTriggerClick = () => {
    if (hoverCapable) {
      cancelCloseTimer();
      if (isOpen) {
        hoverDismissedRef.current = true;
        closeMenu();
        return;
      }
      hoverDismissedRef.current = false;
      openMenu();
      return;
    }
    setIsOpen((open) => !open);
  };

  const handleSelect = (next: string) => {
    onChange(next);
    hoverDismissedRef.current = true;
    closeMenu();
  };

  return (
    <div
      className={cn(shopBarItemClass, "relative")}
      onMouseEnter={handleZoneEnter}
      onMouseLeave={handleZoneLeave}
    >
      <button
        type="button"
        className={cn(
          shopBarItemClass,
          "border-0 bg-transparent p-0 font-semibold text-navy-900 transition-colors hover:text-[#c5a059]",
        )}
        onClick={handleTriggerClick}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={menuId}
      >
        <ArrowUpDown className="h-3.5 w-3.5 sm:hidden text-gray-500" />
        <span className="hidden sm:inline text-gray-500">Sort By:</span>
        <span>{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Sort products"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[12.5rem] border border-[#c5a059]/20 bg-white py-1 shadow-lg"
        >
          {SORT_OPTIONS.map((opt) => {
            const selected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                    selected
                      ? "bg-[#c5a059]/10 text-[#c5a059]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#c5a059]",
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function FilterColumn({
  title,
  children,
  defaultOpen = false,
  isCollapsibleOnMobile = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isCollapsibleOnMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 pb-5 sm:border-0 sm:pb-0">
      <button
        type="button"
        onClick={() => {
          if (isCollapsibleOnMobile) setIsOpen(!isOpen);
        }}
        className={cn(
          "flex w-full items-center justify-between text-left",
          isCollapsibleOnMobile ? "sm:cursor-default" : "cursor-default pointer-events-none"
        )}
        tabIndex={isCollapsibleOnMobile ? 0 : -1}
      >
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5a059] sm:mb-4">
          {title}
        </h4>
        {isCollapsibleOnMobile && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#c5a059] transition-transform duration-200 sm:hidden",
              isOpen ? "rotate-180" : ""
            )}
            aria-hidden
          />
        )}
      </button>
      <div
        className={cn(
          "mt-5 sm:mt-0",
          isCollapsibleOnMobile ? (isOpen ? "block" : "hidden sm:block") : "block"
        )}
      >
        {children}
      </div>
    </div>
  );
}
