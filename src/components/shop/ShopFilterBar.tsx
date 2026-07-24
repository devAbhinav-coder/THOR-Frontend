"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Package,
} from "lucide-react";
import { FilterOptions, FilterCategoryTreeItem } from "@/types";
import { cn } from "@/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/bodyScrollLock";
import type { ShopFilters } from "@/lib/shopFilters";
import {
  isShopListFilterSelected,
  isShopCategoryFilterSelected,
  resolveShopPriceDraft,
  shopPriceDraftToFilterStrings,
} from "@/lib/shopFilters";
import ShopPriceRangeFilter from "@/components/shop/ShopPriceRangeFilter";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";
import { useShopFilterStickyPin } from "@/hooks/useShopFilterStickyPin";
import { variantSwatchBackground } from "@/lib/variantSwatch";
import { catalogMatchKey } from "@/lib/catalogAttributes";

const shopFilterCheckboxClass =
  "h-4 w-4 shrink-0 rounded-none border-gray-300 accent-[#c5a059] text-[#c5a059] focus:ring-[#c5a059]";

function resolveFilterColorCode(
  colorName: string,
  colorCodes?: Record<string, string> | null,
): string | undefined {
  if (!colorCodes) return undefined;
  const direct = colorCodes[colorName];
  if (direct) return direct;
  const key = catalogMatchKey(colorName);
  if (!key) return undefined;
  for (const [name, code] of Object.entries(colorCodes)) {
    if (catalogMatchKey(name) === key) return code;
  }
  return undefined;
}

export function ColorSwatch({
  colorName,
  colorCode,
  className,
}: {
  colorName: string;
  colorCode?: string | null;
  className?: string;
}) {
  const name = colorName.toLowerCase().trim();
  const bg = variantSwatchBackground(colorName, colorCode);
  const isLight =
    name === "white" ||
    name === "cream" ||
    name === "ivory" ||
    name === "off white" ||
    name === "offwhite" ||
    (typeof bg === "string" &&
      /^#(?:f{3}|f{6}|fff(?:fff)?)$/i.test(bg.trim()));

  return (
    <span
      className={cn(
        "inline-block rounded-full border shadow-sm",
        isLight ? "border-gray-300" : "border-gray-200/50",
        className,
      )}
      style={
        bg
          ? { background: bg }
          : { backgroundColor: "#d1d5db" }
      }
      aria-hidden
    />
  );
}

const FILTER_CLOSE_DELAY_MS = 160;
const MOBILE_BAR_HEIGHT =
  "calc(3.25rem + env(safe-area-inset-bottom, 0px))";
/** Must sit above page content and match store mobile chrome stacking. */
const MOBILE_FILTER_BAR_Z = "z-[100]";
const MOBILE_FILTER_OVERLAY_Z = "z-[98]";
const MOBILE_FILTER_SHEET_Z = "z-[99]";

const shopBarTextClass =
  "text-[10px] sm:text-[11px] uppercase tracking-[0.12em] leading-none";
const shopBarItemClass = cn(
  "inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap",
  shopBarTextClass,
);
const shopBarDividerClass =
  "hidden h-4 w-px shrink-0 self-center bg-[#c5a059]/30 sm:block";
const mobileBarDividerClass =
  "h-4 w-px shrink-0 self-center bg-[#c5a059]/30";

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "-createdAt", short: "Newest" },
  { label: "Price: High to Low", value: "-price", short: "High–Low" },
  { label: "Price: Low to High", value: "price", short: "Low–High" },
  { label: "Curated Favorites", value: "-ratings.average", short: "Top rated" },
  { label: "Most Popular", value: "-soldCount", short: "Popular" },
] as const;

type Props = {
  filters: ShopFilters;
  filterOptions: FilterOptions | null;
  categoryTree?: FilterCategoryTreeItem[];
  occasionOptions?: string[];
  subcategories?: Array<{ name?: string; slug?: string } | string>;
  activeFilterCount: number;
  showClearFilters: boolean;
  isFilterOpen: boolean;
  onOpenFilter: () => void;
  onCloseFilter: () => void;
  onToggleFilter: () => void;
  onUpdateFilter: (key: string, value: string | number) => void;
  onClearFilters: () => void;
  onApplyPriceFilters: (minPrice: string, maxPrice: string) => void;
  quickColors: string[];
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

export default function ShopFilterBar(props: Props) {
  const {
    filters,
    filterOptions,
    categoryTree: categoryTreeProp,
    occasionOptions: occasionOptionsProp,
    subcategories,
    activeFilterCount,
    showClearFilters,
    isFilterOpen,
    onOpenFilter,
    onCloseFilter,
    onToggleFilter,
    onUpdateFilter,
    onClearFilters,
    onApplyPriceFilters,
    quickColors,
    productCountLabel,
  } = props;

  const filterMenuId = useId();
  const hoverCapable = useHoverCapablePointer();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDismissedRef = useRef(false);
  const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);
  const [mounted, setMounted] = useState(false);
  const { sentinelRef, toolbarRef, pinned, navHeight, toolbarHeight } =
    useShopFilterStickyPin(mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleApplyPriceFilters = useCallback(() => {
    const { min, max } = resolveShopPriceDraft(draftMinPrice, draftMaxPrice);
    const { minPrice, maxPrice } = shopPriceDraftToFilterStrings(min, max);
    onApplyPriceFilters(minPrice, maxPrice);
  }, [draftMinPrice, draftMaxPrice, onApplyPriceFilters]);

  const handleApplyFilters = useCallback(() => {
    handleApplyPriceFilters();
    hoverDismissedRef.current = true;
    onCloseFilter();
  }, [handleApplyPriceFilters, onCloseFilter]);

  const handleClearFiltersAndClose = useCallback(() => {
    onClearFilters();
    hoverDismissedRef.current = true;
    onCloseFilter();
  }, [onClearFilters, onCloseFilter]);

  /* Lock page scroll while mobile filter sheet is open. */
  useEffect(() => {
    if (!mounted || !isFilterOpen) return;
    const mq = window.matchMedia("(max-width: 639px)");
    if (!mq.matches) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isFilterOpen, mounted]);

  const filterPanelDesktop = (
    <ShopFilterPanel
      filters={filters}
      filterOptions={filterOptions}
      categoryTree={categoryTreeProp}
      occasionOptions={occasionOptionsProp}
      subcategories={subcategories}
      draftMinPrice={draftMinPrice}
      draftMaxPrice={draftMaxPrice}
      onUpdateFilter={onUpdateFilter}
      onMinPriceChange={setDraftMinPrice}
      onMaxPriceChange={setDraftMaxPrice}
      mobileSheet={false}
      onApply={handleApplyFilters}
    />
  );

  const filterPanelMobile = (
    <ShopFilterPanel
      filters={filters}
      filterOptions={filterOptions}
      categoryTree={categoryTreeProp}
      occasionOptions={occasionOptionsProp}
      subcategories={subcategories}
      draftMinPrice={draftMinPrice}
      draftMaxPrice={draftMaxPrice}
      onUpdateFilter={onUpdateFilter}
      onMinPriceChange={setDraftMinPrice}
      onMaxPriceChange={setDraftMaxPrice}
      mobileSheet
    />
  );

  const toolbarProps = {
    filters,
    activeFilterCount,
    showClearFilters,
    isFilterOpen,
    filterMenuId,
    productCountLabel,
    hoverCapable,
    quickColors,
    colorCodes: filterOptions?.colorCodes,
    onFilterTriggerClick: handleFilterTriggerClick,
    onClearFilters,
    onUpdateFilter,
  };

  const mobileFilterChrome =
    mounted ?
      createPortal(
        <>
          <div
            className={cn(
              "lg:hidden fixed inset-x-0 bottom-0 border-t border-[#c5a059]/30 bg-white shadow-[0_-8px_32px_rgba(0,13,33,0.12)] pb-[env(safe-area-inset-bottom,0px)]",
              MOBILE_FILTER_BAR_Z,
            )}
            role="toolbar"
            aria-label="Shop filters and sort"
          >
            <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-3.5 min-h-[3.25rem]">
              <ShopFilterToolbar
                {...toolbarProps}
                quickColors={[]}
                sortDropUp
                mobileBar
              />
            </div>
          </div>

          {isFilterOpen ?
            <>
              <button
                type="button"
                className={cn(
                  "lg:hidden fixed inset-0 bg-black/45",
                  MOBILE_FILTER_OVERLAY_Z,
                )}
                aria-label="Close filters"
                onClick={onCloseFilter}
              />
              <div
                id={filterMenuId}
                data-lenis-prevent-vertical
                className={cn(
                  "lg:hidden fixed inset-x-0 flex flex-col overflow-hidden border-t border-[#c5a059]/20 bg-white shadow-2xl",
                  MOBILE_FILTER_SHEET_Z,
                )}
                style={{
                  bottom: MOBILE_BAR_HEIGHT,
                  maxHeight: `calc(100dvh - ${MOBILE_BAR_HEIGHT} - 3.5rem)`,
                }}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900">
                    Filters
                    {activeFilterCount > 0 ?
                      <span className="ml-2 text-[#c5a059]">
                        ({activeFilterCount})
                      </span>
                    : null}
                  </p>
                  <button
                    type="button"
                    onClick={onCloseFilter}
                    className="inline-flex h-8 w-8 items-center justify-center text-gray-500"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {filterPanelMobile}
                </div>
                <FilterApplyFooter
                  onApply={handleApplyFilters}
                  onClear={handleClearFiltersAndClose}
                  showClear={showClearFilters}
                  className="shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
                />
              </div>
            </>
          : null}
        </>,
        document.body,
      )
    : null;

  return (
    <>
      {mobileFilterChrome}
    </>
  );
}

type ToolbarProps = {
  filters: ShopFilters;
  activeFilterCount: number;
  showClearFilters: boolean;
  isFilterOpen: boolean;
  filterMenuId: string;
  productCountLabel: string;
  hoverCapable: boolean;
  quickColors: string[];
  colorCodes?: Record<string, string>;
  onFilterTriggerClick: () => void;
  onClearFilters: () => void;
  onUpdateFilter: (key: string, value: string | number) => void;
  sortDropUp?: boolean;
  mobileBar?: boolean;
};

function ShopFilterToolbar({
  filters,
  activeFilterCount,
  showClearFilters,
  isFilterOpen,
  filterMenuId,
  productCountLabel,
  hoverCapable,
  quickColors,
  colorCodes,
  onFilterTriggerClick,
  onClearFilters,
  onUpdateFilter,
  sortDropUp = false,
  mobileBar = false,
}: ToolbarProps) {
  const divider = mobileBar ? mobileBarDividerClass : shopBarDividerClass;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-2",
        !mobileBar && "flex-wrap sm:flex-nowrap sm:gap-4",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-3",
          !mobileBar && "flex-1 sm:gap-8",
        )}
      >
        <button
          type="button"
          className={cn(
            shopBarItemClass,
            "gap-2 font-semibold text-navy-900 transition-all duration-300",
            !mobileBar && "hover:tracking-[0.16em]",
          )}
          onClick={onFilterTriggerClick}
          aria-expanded={isFilterOpen}
          aria-controls={filterMenuId}
        >
          {isFilterOpen ?
            <X className="h-4 w-4" aria-hidden />
          : <SlidersHorizontal className="h-4 w-4" aria-hidden />}
          {isFilterOpen ? "Close" : "Filter"}
          {activeFilterCount > 0 && !isFilterOpen ?
            <span className="ml-0.5 text-[#c5a059]">
              ({activeFilterCount})
            </span>
          : null}
        </button>

        {!mobileBar && (
          <>
            <div className={shopBarDividerClass} aria-hidden />
            <div
              {...horizontalScrollSurfaceProps}
              className={cn(
                "hidden min-w-0 flex-1 items-center gap-4 sm:flex sm:gap-6",
                horizontalScrollSurfaceClassName,
                "scrollbar-hide",
              )}
            >
              {quickColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdateFilter("colors", color)}
                  className={cn(
                    shopBarItemClass,
                    "font-semibold transition-colors flex items-center gap-2",
                    isShopListFilterSelected(filters.colors, color) ?
                      "text-[#c5a059]"
                    : "text-gray-500 hover:text-[#c5a059]",
                  )}
                >
                  <ColorSwatch
                    colorName={color}
                    colorCode={resolveFilterColorCode(color, colorCodes)}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  {color}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
        {showClearFilters && !mobileBar ?
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
            <span className={divider} aria-hidden />
          </>
        : null}
        <span className={cn(shopBarItemClass, "font-medium text-gray-500")}>
          {!mobileBar ?
            <>
              <Package className="h-3.5 w-3.5 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">{productCountLabel}</span>
              <span className="sm:hidden">{parseInt(productCountLabel) || 0}</span>
            </>
          : <span>{productCountLabel}</span>}
        </span>
        <span className={divider} aria-hidden />
        <ShopSortDropdown
          value={filters.sort}
          onChange={(next) => onUpdateFilter("sort", next)}
          hoverCapable={hoverCapable}
          dropUp={sortDropUp}
          compact={mobileBar}
        />
      </div>
    </div>
  );
}

function CategoryTreeFilter({
  categoryTree,
  filters,
  onUpdateFilter,
  sidebar = false,
}: {
  categoryTree: FilterCategoryTreeItem[];
  filters: ShopFilters;
  onUpdateFilter: (key: string, value: string | number) => void;
  sidebar?: boolean;
}) {
  if (!categoryTree.length) return null;

  return (
    <ul className={cn("space-y-1", sidebar ? "space-y-0.5" : "space-y-3")}>
      {categoryTree.map((cat) => {
        const catSelected = isShopCategoryFilterSelected(
          filters.categories,
          cat.name,
        );
        const hasSubs = cat.subcategories.length > 0;
        const selectedSubCount = cat.subcategories.filter((sub) =>
          isShopListFilterSelected(filters.subcategories, sub.name),
        ).length;

        return (
          <li
            key={cat.slug || cat.name}
            className={cn(
              sidebar && "rounded-md",
              sidebar && catSelected && "bg-[#c5a059]/5",
            )}
          >
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors",
                catSelected ?
                  "font-semibold text-[#c5a059]"
                : "font-medium text-navy-900 hover:text-[#c5a059]",
              )}
            >
              <input
                type="checkbox"
                checked={catSelected}
                onChange={() => onUpdateFilter("categories", cat.name)}
                className={shopFilterCheckboxClass}
              />
              <span className="flex-1 leading-snug">{cat.name}</span>
              {hasSubs && selectedSubCount > 0 ?
                <span className="text-[10px] font-semibold tabular-nums text-[#c5a059]">
                  {selectedSubCount}
                </span>
              : null}
            </label>

            {hasSubs && (
              <ul
                className={cn(
                  "ml-3 space-y-0.5 border-l-2 pl-3",
                  sidebar ?
                    "mb-2 ml-4 border-[#c5a059]/25"
                  : "mt-1.5 border-gray-100",
                )}
              >
                {cat.subcategories.map((sub) => {
                  const subSelected = isShopListFilterSelected(
                    filters.subcategories,
                    sub.name,
                  );
                  return (
                    <li key={`${cat.slug}-${sub.slug}`}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 transition-colors",
                          subSelected ?
                            "font-medium text-[#c5a059]"
                          : "text-gray-500 hover:text-[#c5a059]",
                          sidebar && subSelected && "bg-[#c5a059]/5",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={subSelected}
                          onChange={() =>
                            onUpdateFilter("subcategories", sub.name)
                          }
                          className={shopFilterCheckboxClass}
                        />
                        <span className="text-[13px] leading-snug">{sub.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FlatCategoryFilter({
  categories,
  filters,
  onUpdateFilter,
}: {
  categories: string[];
  filters: ShopFilters;
  onUpdateFilter: (key: string, value: string | number) => void;
}) {
  return (
    <ul className="space-y-2 text-sm">
      {categories.map((cat) => {
        const selected = isShopCategoryFilterSelected(filters.categories, cat);
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
  );
}

export function ShopFilterPanel({
  filters,
  filterOptions,
  categoryTree: categoryTreeProp,
  occasionOptions: occasionOptionsProp,
  subcategories,
  draftMinPrice,
  draftMaxPrice,
  onUpdateFilter,
  onMinPriceChange,
  onMaxPriceChange,
  mobileSheet = false,
  sidebar = false,
  onApply,
}: {
  filters: ShopFilters;
  filterOptions: FilterOptions | null;
  categoryTree?: FilterCategoryTreeItem[];
  occasionOptions?: string[];
  subcategories?: any[];
  draftMinPrice: string;
  draftMaxPrice: string;
  onUpdateFilter: (key: string, value: string | number) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  mobileSheet?: boolean;
  sidebar?: boolean;
  onApply?: () => void;
}) {
  const columnDefaultOpen = mobileSheet || sidebar;
  const categoryTree =
    categoryTreeProp?.length ?
      categoryTreeProp
    : (filterOptions?.categoryTree ?? []);
  const flatCategories = filterOptions?.categories ?? [];
  const colors = filterOptions?.colors ?? [];
  const colorCodes = filterOptions?.colorCodes ?? {};
  const occasions = occasionOptionsProp ?? filterOptions?.occasions ?? [];

  const filterCheckboxList = (
    items: string[],
    selectedList: string[],
    filterKey: string,
  ) => (
    <ul className={cn("space-y-0.5", sidebar ? "" : "space-y-2 text-sm")}>
      {items.map((item) => {
        const selected = isShopListFilterSelected(selectedList, item);
        return (
          <li key={item}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors",
                selected ?
                  "font-medium text-[#c5a059]"
                : "text-gray-600 hover:text-[#c5a059]",
                sidebar && selected && "bg-[#c5a059]/5",
              )}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onUpdateFilter(filterKey, item)}
                className={shopFilterCheckboxClass}
              />
              {filterKey === "colors" && (
                <ColorSwatch
                  colorName={item}
                  colorCode={resolveFilterColorCode(item, colorCodes)}
                  className="h-3.5 w-3.5 shrink-0"
                />
              )}
              <span className={cn(sidebar ? "text-[13px] leading-snug" : "text-sm")}>
                {item}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={cn(
      sidebar ?
        "flex flex-col gap-6"
      : "grid gap-8",
      !sidebar && (mobileSheet ?
        "grid-cols-1 mx-auto max-w-7xl px-4 py-6 sm:px-6"
      : "mx-auto max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"),
    )}>
      <FilterColumn title="Offers" defaultOpen={columnDefaultOpen} sidebar={sidebar}>
        <ul className={cn("space-y-0.5", sidebar ? "" : "space-y-2 text-sm")}>
          <li>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors",
                filters.onSale === "true" ?
                  "font-medium text-[#c5a059]"
                : "text-gray-600 hover:text-[#c5a059]",
                sidebar && filters.onSale === "true" && "bg-[#c5a059]/5",
              )}
            >
              <input
                type="checkbox"
                checked={filters.onSale === "true"}
                onChange={() => onUpdateFilter("onSale", "true")}
                className={shopFilterCheckboxClass}
              />
              <span className={cn(sidebar ? "text-[13px] leading-snug" : "text-sm")}>
                On Sale
              </span>
            </label>
          </li>
        </ul>
      </FilterColumn>

      <FilterColumn title="Collections" defaultOpen={columnDefaultOpen} sidebar={sidebar}>
        {categoryTree.length > 0 ?
          <CategoryTreeFilter
            categoryTree={categoryTree}
            filters={filters}
            onUpdateFilter={onUpdateFilter}
            sidebar={sidebar}
          />
        : flatCategories.length > 0 ?
          <FlatCategoryFilter
            categories={flatCategories}
            filters={filters}
            onUpdateFilter={onUpdateFilter}
          />
        : subcategories && subcategories.length > 0 ?
          filterCheckboxList(
            subcategories.map((sub: { name?: string } | string) =>
              typeof sub === "string" ? sub : sub.name || "",
            ).filter(Boolean),
            filters.subcategories,
            "subcategories",
          )
        : <p className="text-sm text-gray-400">No collections available</p>}
      </FilterColumn>

      <FilterColumn title="Color" defaultOpen={columnDefaultOpen} sidebar={sidebar}>
        {colors.length > 0 ?
          filterCheckboxList(colors, filters.colors, "colors")
        : <p className="text-sm text-gray-400">No colors available</p>}
      </FilterColumn>

      <FilterColumn title="Occasion" defaultOpen={columnDefaultOpen} sidebar={sidebar}>
        {occasions.length > 0 ?
          filterCheckboxList(occasions, filters.occasions, "occasions")
        : <p className="text-sm text-gray-400">No occasions available</p>}
      </FilterColumn>

      <FilterColumn title="Rating" defaultOpen={columnDefaultOpen} sidebar={sidebar}>
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

      <FilterColumn title="Price" isCollapsibleOnMobile={false} sidebar={sidebar}>
        <ShopPriceRangeFilter
          minPrice={draftMinPrice}
          maxPrice={draftMaxPrice}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
        />
        {!mobileSheet && onApply ?
          <button
            type="button"
            onClick={onApply}
            className="mt-6 w-full bg-navy-900 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy-800"
          >
            Apply Filters
          </button>
        : null}
      </FilterColumn>
    </div>
  );
}

export function ShopSortDropdown({
  value,
  onChange,
  hoverCapable,
  dropUp = false,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  hoverCapable: boolean;
  dropUp?: boolean;
  compact?: boolean;
}) {
  const menuId = useId();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDismissedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const selected =
    SORT_OPTIONS.find((opt) => opt.value === value) ?? SORT_OPTIONS[0];

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
          "max-w-[9.5rem] border-0 bg-transparent p-0 font-semibold text-navy-900 transition-colors hover:text-[#c5a059] sm:max-w-none",
        )}
        onClick={handleTriggerClick}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={menuId}
      >
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
        {!compact && (
          <span className="hidden sm:inline text-gray-500">Sort By:</span>
        )}
        <span className="truncate">{compact ? selected.short : selected.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen ?
        <ul
          id={menuId}
          role="listbox"
          aria-label="Sort products"
          className={cn(
            "absolute right-0 z-50 min-w-[12.5rem] border border-[#c5a059]/20 bg-white py-1 shadow-lg",
            dropUp ?
              "bottom-[calc(100%+0.5rem)]"
            : "top-[calc(100%+0.5rem)]",
          )}
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                    isSelected ?
                      "bg-[#c5a059]/10 text-[#c5a059]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#c5a059]",
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      : null}
    </div>
  );
}

function FilterApplyFooter({
  onApply,
  onClear,
  showClear,
  className,
}: {
  onApply: () => void;
  onClear: () => void;
  showClear: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t border-gray-100 bg-white px-4 py-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl gap-3",
          showClear ? "grid grid-cols-2" : "justify-end",
        )}
      >
        {showClear ?
          <button
            type="button"
            onClick={onClear}
            className="h-11 border border-gray-200 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-700 transition-colors hover:border-[#c5a059] hover:text-[#c5a059]"
          >
            Clear all filters
          </button>
        : null}
        <button
          type="button"
          onClick={onApply}
          className={cn(
            "h-11 bg-navy-900 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy-800",
            showClear ? "w-full" : "w-full sm:min-w-[12rem] sm:w-auto",
          )}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function FilterColumn({
  title,
  children,
  defaultOpen = false,
  isCollapsibleOnMobile = true,
  sidebar = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isCollapsibleOnMobile?: boolean;
  sidebar?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (sidebar) {
    return (
      <div className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c5a059]">
          {title}
        </h4>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 pb-5 sm:border-0 sm:pb-0">
      <button
        type="button"
        onClick={() => {
          if (isCollapsibleOnMobile) setIsOpen(!isOpen);
        }}
        className={cn(
          "flex w-full items-center justify-between text-left",
          isCollapsibleOnMobile ?
            "sm:cursor-default"
          : "pointer-events-none cursor-default",
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
              isOpen ? "rotate-180" : "",
            )}
            aria-hidden
          />
        )}
      </button>
      <div
        className={cn(
          "mt-5 sm:mt-0",
          isCollapsibleOnMobile ?
            isOpen ? "block"
            : "hidden sm:block"
          : "block",
        )}
      >
        {children}
      </div>
    </div>
  );
}
