"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Package,
} from "lucide-react";
import { FilterOptions, FilterCategoryTreeItem, MarketingEdition } from "@/types";
import { cn } from "@/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/bodyScrollLock";
import type {
  ShopCategoryContext,
  ShopFilters,
} from "@/lib/shopFilters";
import {
  isShopListFilterSelected,
  isShopCategoryFilterSelected,
  isShopPriceDraftPending,
  resolveShopPriceDraft,
  resolveShopFilterFocusSection,
  shopFilterSectionHasActive,
  shopPriceDraftToFilterStrings,
  type ShopFilterSectionId,
} from "@/lib/shopFilters";
import ShopPriceRangeFilter from "@/components/shop/ShopPriceRangeFilter";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";
import { variantSwatchBackground } from "@/lib/variantSwatch";
import { catalogMatchKey } from "@/lib/catalogAttributes";

const shopFilterCheckboxClass =
  "h-4 w-4 shrink-0 rounded-sm border-gray-300/90 accent-[#c5a059] text-[#c5a059] focus:ring-[#c5a059]/40";

function sidebarFilterOptionClass(selected: boolean) {
  return cn(
    "flex min-w-0 cursor-pointer items-center gap-2.5 border px-2.5 py-2 transition-all duration-200",
    selected ?
      "border-[#c5a059]/35 bg-white font-medium text-[#9a7b42] shadow-[0_2px_8px_rgba(197,160,89,0.12)]"
    : "border-transparent bg-white/40 text-navy-900/80 hover:border-[#c5a059]/15 hover:bg-white hover:text-[#c5a059]",
  );
}

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
  marketingEditions?: MarketingEdition[];
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
  categoryContext?: ShopCategoryContext;
  onClearSection?: (section: ShopFilterSectionId) => void;
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
    marketingEditions: marketingEditionsProp = [],
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
    categoryContext = null,
    onClearSection,
  } = props;

  const filterMenuId = useId();
  const hoverCapable = useHoverCapablePointer();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDismissedRef = useRef(false);
  const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);
  const [mounted, setMounted] = useState(false);

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

  const revertPriceDraft = useCallback(() => {
    setDraftMinPrice(filters.minPrice);
    setDraftMaxPrice(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

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
      marketingEditions={marketingEditionsProp}
      subcategories={subcategories}
      draftMinPrice={draftMinPrice}
      draftMaxPrice={draftMaxPrice}
      onUpdateFilter={onUpdateFilter}
      onMinPriceChange={setDraftMinPrice}
      onMaxPriceChange={setDraftMaxPrice}
      mobileSheet={false}
      onApply={handleApplyFilters}
      categoryContext={categoryContext}
    />
  );

  const filterPanelMobile = (
    <ShopFilterPanel
      filters={filters}
      filterOptions={filterOptions}
      categoryTree={categoryTreeProp}
      occasionOptions={occasionOptionsProp}
      marketingEditions={marketingEditionsProp}
      subcategories={subcategories}
      draftMinPrice={draftMinPrice}
      draftMaxPrice={draftMaxPrice}
      onUpdateFilter={onUpdateFilter}
      onMinPriceChange={setDraftMinPrice}
      onMaxPriceChange={setDraftMaxPrice}
      mobileSheet
      onRevertPriceDraft={revertPriceDraft}
      filterSheetOpen={isFilterOpen}
      categoryContext={categoryContext}
      onClearSection={onClearSection}
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
                data-lenis-prevent
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
                  pricePending={isShopPriceDraftPending(
                    filters,
                    draftMinPrice,
                    draftMaxPrice,
                  )}
                  className="shrink-0"
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

function collectionFilterRowClass(selected: boolean, compact: boolean) {
  return cn(
    "flex min-w-0 cursor-pointer items-center gap-2.5 transition-colors duration-200",
    compact ? "px-2.5 py-2" : "rounded-md px-1 py-1.5",
    selected ?
      "font-medium text-[#c5a059]"
    : compact ?
      "text-navy-900/90 hover:text-[#c5a059]"
    : "text-gray-600 hover:text-[#c5a059]",
  );
}

function CollectionSubcategoryRows({
  items,
  filters,
  onUpdateFilter,
  compact,
}: {
  items: Array<{ name: string; slug?: string }>;
  filters: ShopFilters;
  onUpdateFilter: (key: string, value: string | number) => void;
  compact: boolean;
}) {
  return (
    <ul
      className={cn(
        "min-w-0 space-y-0.5 overflow-x-hidden",
        compact ? "px-1.5 pb-2 pt-1" : "space-y-2 text-sm",
      )}
    >
      {items.map((sub) => {
        const subSelected = isShopListFilterSelected(
          filters.subcategories,
          sub.name,
        );
        const key = sub.slug || sub.name;
        return (
          <li key={key}>
            <label
              className={cn(
                collectionFilterRowClass(subSelected, compact),
                compact &&
                  cn(
                    subSelected ?
                      "bg-white shadow-sm ring-1 ring-[#c5a059]/25"
                    : "hover:bg-white/70",
                  ),
              )}
            >
              <input
                type="checkbox"
                checked={subSelected}
                onChange={() => onUpdateFilter("subcategories", sub.name)}
                className={shopFilterCheckboxClass}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 break-words leading-snug",
                  compact ? "text-[12px] tracking-[0.01em]" : "text-[13px]",
                )}
              >
                {sub.name}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryTreeFilter({
  categoryTree,
  filters,
  onUpdateFilter,
  sidebar = false,
  compact = false,
}: {
  categoryTree: FilterCategoryTreeItem[];
  filters: ShopFilters;
  onUpdateFilter: (key: string, value: string | number) => void;
  sidebar?: boolean;
  /** Sidebar + mobile sheet: card layout with expandable sub-types. */
  compact?: boolean;
}) {
  const useCompact = compact || sidebar;

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      for (const cat of categoryTree) {
        const key = cat.slug || cat.name;
        const catSelected = isShopCategoryFilterSelected(
          filters.categories,
          cat.name,
        );
        const selectedSubCount = cat.subcategories.filter((sub) =>
          isShopListFilterSelected(filters.subcategories, sub.name),
        ).length;
        if (catSelected || selectedSubCount > 0) {
          next.add(key);
        }
      }
      return next;
    });
  }, [categoryTree, filters.categories, filters.subcategories]);

  if (!categoryTree.length) return null;

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!useCompact) {
    return (
      <ul className="min-w-0 space-y-3 overflow-x-hidden">
        {categoryTree.map((cat) => {
          const catSelected = isShopCategoryFilterSelected(
            filters.categories,
            cat.name,
          );
          const hasSubs = cat.subcategories.length > 0;

          return (
            <li key={cat.slug || cat.name}>
              <label
                className={collectionFilterRowClass(catSelected, false)}
              >
                <input
                  type="checkbox"
                  checked={catSelected}
                  onChange={() => onUpdateFilter("categories", cat.name)}
                  className={shopFilterCheckboxClass}
                />
                <span className="flex-1 leading-snug">{cat.name}</span>
              </label>
              {hasSubs ?
                <ul className="ml-3 mt-1.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                  {cat.subcategories.map((sub) => {
                    const subSelected = isShopListFilterSelected(
                      filters.subcategories,
                      sub.name,
                    );
                    return (
                      <li key={`${cat.slug}-${sub.slug}`}>
                        <label
                          className={collectionFilterRowClass(subSelected, false)}
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
              : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="min-w-0 space-y-2 overflow-x-hidden">
      {categoryTree.map((cat) => {
        const key = cat.slug || cat.name;
        const catSelected = isShopCategoryFilterSelected(
          filters.categories,
          cat.name,
        );
        const hasSubs = cat.subcategories.length > 0;
        const selectedSubCount = cat.subcategories.filter((sub) =>
          isShopListFilterSelected(filters.subcategories, sub.name),
        ).length;
        const isExpanded = expandedKeys.has(key);
        const isActiveGroup = catSelected || selectedSubCount > 0;

        return (
          <li
            key={key}
            className={cn(
              "overflow-hidden border transition-all duration-200",
              isActiveGroup ?
                "border-[#c5a059]/40 bg-gradient-to-b from-[#c5a059]/[0.07] to-white shadow-[0_1px_0_rgba(197,160,89,0.12)]"
              : "border-gray-100/90 bg-white hover:border-[#c5a059]/20 hover:shadow-sm",
            )}
          >
            <div className="flex min-w-0 items-stretch">
              <label
                className={cn(
                  "flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-3 py-2.5",
                  catSelected ?
                    "text-[#c5a059]"
                  : "text-navy-900 hover:text-[#c5a059]",
                )}
              >
                <input
                  type="checkbox"
                  checked={catSelected}
                  onChange={() => onUpdateFilter("categories", cat.name)}
                  className={shopFilterCheckboxClass}
                />
                <span className="min-w-0 flex-1 font-serif text-[13px] leading-snug tracking-wide">
                  {cat.name}
                </span>
                {selectedSubCount > 0 ?
                  <span className="shrink-0 rounded-full bg-[#c5a059]/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#a68648]">
                    {selectedSubCount}
                  </span>
                : null}
              </label>
              {hasSubs ?
                <button
                  type="button"
                  onClick={() => toggleExpanded(key)}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center border-l px-2.5 transition-colors",
                    isActiveGroup ?
                      "border-[#c5a059]/20 text-[#c5a059] hover:bg-[#c5a059]/5"
                    : "border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-[#c5a059]",
                  )}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Hide" : "Show"} ${cat.name} types`}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 ease-out",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
              : null}
            </div>

            {hasSubs && isExpanded ?
              <div className="border-t border-[#c5a059]/10 bg-[#faf8f5]/90">
                <p className="px-3 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Shop by type
                </p>
                <CollectionSubcategoryRows
                  items={cat.subcategories}
                  filters={filters}
                  onUpdateFilter={onUpdateFilter}
                  compact
                />
              </div>
            : null}
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
  compact = false,
}: {
  categories: string[];
  filters: ShopFilters;
  onUpdateFilter: (key: string, value: string | number) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <ul className="min-w-0 space-y-2 overflow-x-hidden">
        {categories.map((cat) => {
          const selected = isShopCategoryFilterSelected(filters.categories, cat);
          return (
            <li
              key={cat}
              className={cn(
                "overflow-hidden border transition-all duration-200",
                selected ?
                  "border-[#c5a059]/40 bg-gradient-to-b from-[#c5a059]/[0.07] to-white"
                : "border-gray-100/90 bg-white hover:border-[#c5a059]/20",
              )}
            >
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 px-3 py-2.5",
                  selected ?
                    "text-[#c5a059]"
                  : "text-navy-900 hover:text-[#c5a059]",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onUpdateFilter("categories", cat)}
                  className={shopFilterCheckboxClass}
                />
                <span className="font-serif text-[13px] leading-snug tracking-wide">
                  {cat}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {categories.map((cat) => {
        const selected = isShopCategoryFilterSelected(filters.categories, cat);
        return (
          <li key={cat}>
            <label className={collectionFilterRowClass(selected, false)}>
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
  marketingEditions: marketingEditionsProp = [],
  subcategories,
  draftMinPrice,
  draftMaxPrice,
  onUpdateFilter,
  onMinPriceChange,
  onMaxPriceChange,
  mobileSheet = false,
  sidebar = false,
  onApply,
  onRevertPriceDraft,
  filterSheetOpen = false,
  categoryContext = null,
  onClearSection,
}: {
  filters: ShopFilters;
  filterOptions: FilterOptions | null;
  categoryTree?: FilterCategoryTreeItem[];
  occasionOptions?: string[];
  marketingEditions?: MarketingEdition[];
  subcategories?: any[];
  draftMinPrice: string;
  draftMaxPrice: string;
  onUpdateFilter: (key: string, value: string | number) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  mobileSheet?: boolean;
  sidebar?: boolean;
  onApply?: () => void;
  onRevertPriceDraft?: () => void;
  filterSheetOpen?: boolean;
  categoryContext?: ShopCategoryContext;
  onClearSection?: (section: ShopFilterSectionId) => void;
}) {
  const useAccordion = sidebar || mobileSheet;
  const pricePending = isShopPriceDraftPending(
    filters,
    draftMinPrice,
    draftMaxPrice,
  );

  const [focusedSection, setFocusedSection] = useState<ShopFilterSectionId | null>(
    () =>
      useAccordion ?
        resolveShopFilterFocusSection(filters, categoryContext)
      : null,
  );

  const collectionRouteKey = categoryContext?.slug ?? "";
  const prevCollectionRouteKey = useRef(collectionRouteKey);

  useEffect(() => {
    if (!useAccordion) return;
    if (prevCollectionRouteKey.current !== collectionRouteKey) {
      prevCollectionRouteKey.current = collectionRouteKey;
      setFocusedSection(
        resolveShopFilterFocusSection(filters, categoryContext),
      );
    }
  }, [useAccordion, collectionRouteKey, filters, categoryContext]);

  const filterSheetWasOpen = useRef(false);
  useEffect(() => {
    if (!mobileSheet) return;
    if (filterSheetOpen && !filterSheetWasOpen.current) {
      setFocusedSection(
        resolveShopFilterFocusSection(filters, categoryContext),
      );
    }
    filterSheetWasOpen.current = filterSheetOpen;
  }, [mobileSheet, filterSheetOpen, filters, categoryContext]);

  const sectionHasActive = useCallback(
    (id: ShopFilterSectionId) =>
      shopFilterSectionHasActive(id, filters, categoryContext),
    [filters, categoryContext],
  );

  const isSectionOpen = useCallback(
    (id: ShopFilterSectionId) => {
      if (!useAccordion) return true;
      return focusedSection === id;
    },
    [useAccordion, focusedSection],
  );

  const toggleSection = useCallback(
    (id: ShopFilterSectionId) => {
      if (!useAccordion) return;

      if (focusedSection === id) {
        setFocusedSection(null);
        if (id === "price") onRevertPriceDraft?.();
        return;
      }

      if (focusedSection === "price") onRevertPriceDraft?.();
      setFocusedSection(id);
    },
    [useAccordion, focusedSection, onRevertPriceDraft],
  );

  const sectionShowsActive = useCallback(
    (id: ShopFilterSectionId) => {
      if (id === "price") {
        return sectionHasActive(id) || pricePending;
      }
      return sectionHasActive(id);
    },
    [sectionHasActive, pricePending],
  );

  const accordionProps = (id: ShopFilterSectionId) => {
    const hasActive = sectionShowsActive(id);
    return useAccordion ?
        {
          accordion: true as const,
          isOpen: isSectionOpen(id),
          onToggle: () => toggleSection(id),
          hasActiveSelection: hasActive,
          onClearSection:
            hasActive && onClearSection ?
              () => onClearSection(id)
            : undefined,
        }
      : {};
  };
  const categoryTree =
    categoryTreeProp?.length ?
      categoryTreeProp
    : (filterOptions?.categoryTree ?? []);
  const flatCategories = filterOptions?.categories ?? [];
  const colors = filterOptions?.colors ?? [];
  const colorCodes = filterOptions?.colorCodes ?? {};
  const occasions = occasionOptionsProp ?? filterOptions?.occasions ?? [];
  const marketingEditions = marketingEditionsProp ?? [];

  const filterCheckboxList = (
    items: string[],
    selectedList: string[],
    filterKey: string,
  ) => (
    <ul
      className={cn(
        "min-w-0 space-y-0.5 overflow-x-hidden",
        sidebar ? "" : "space-y-2 text-sm",
      )}
    >
      {items.map((item) => {
        const selected = isShopListFilterSelected(selectedList, item);
        return (
          <li key={item} className="min-w-0">
            <label
              className={cn(
                sidebar ?
                  sidebarFilterOptionClass(selected)
                : cn(
                    "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors",
                    selected ?
                      "font-medium text-[#c5a059]"
                    : "text-gray-600 hover:text-[#c5a059]",
                  ),
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
                  className={cn(
                    "shrink-0 ring-1 ring-navy-950/10",
                    sidebar ? "h-4 w-4" : "h-3.5 w-3.5",
                  )}
                />
              )}
              <span
                className={cn(
                  "min-w-0 break-words",
                  sidebar ? "text-[13px] leading-snug" : "text-sm",
                )}
              >
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
        "flex min-w-0 flex-col gap-2 overflow-x-hidden"
      : "grid gap-8",
      !sidebar && (mobileSheet ?
        "grid-cols-1 mx-auto max-w-7xl px-4 py-6 sm:px-6"
      : "mx-auto max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"),
    )}>
      <FilterColumn
        title="Offers"
        sidebar={sidebar}
        mobileSheet={mobileSheet}
        {...accordionProps("offers")}
      >
        <ul className={cn("space-y-0.5", sidebar ? "" : "space-y-2 text-sm")}>
          <li>
            <label
              className={cn(
                sidebar ?
                  sidebarFilterOptionClass(filters.onSale === "true")
                : cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors",
                    filters.onSale === "true" ?
                      "font-medium text-[#c5a059]"
                    : "text-gray-600 hover:text-[#c5a059]",
                  ),
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

      {marketingEditions.length > 0 ?
        <FilterColumn
          title="Edits & tyohar"
          sidebar={sidebar}
          mobileSheet={mobileSheet}
          {...accordionProps("editions")}
        >
          <ul className={cn("space-y-0.5", sidebar ? "" : "space-y-2 text-sm")}>
            {marketingEditions.map((edition) => {
              const selected = isShopListFilterSelected(
                filters.editions,
                edition.slug,
              );
              const label = edition.filterLabel || edition.label;
              return (
                <li key={edition.slug}>
                  <label
                    className={cn(
                      sidebar ?
                        sidebarFilterOptionClass(selected)
                      : cn(
                          "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors",
                          selected ?
                            "font-medium text-[#c5a059]"
                          : "text-gray-600 hover:text-[#c5a059]",
                        ),
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onUpdateFilter("editions", edition.slug)}
                      className={shopFilterCheckboxClass}
                    />
                    <span
                      className={cn(
                        sidebar ? "text-[13px] leading-snug" : "text-sm",
                        "min-w-0 break-words",
                      )}
                    >
                      {label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </FilterColumn>
      : null}

      <FilterColumn
        title="Collections"
        sidebar={sidebar}
        mobileSheet={mobileSheet}
        {...accordionProps("collections")}
      >
        {categoryTree.length > 0 ?
          <CategoryTreeFilter
            categoryTree={categoryTree}
            filters={filters}
            onUpdateFilter={onUpdateFilter}
            sidebar={sidebar}
            compact={sidebar || mobileSheet}
          />
        : flatCategories.length > 0 ?
          <FlatCategoryFilter
            categories={flatCategories}
            filters={filters}
            onUpdateFilter={onUpdateFilter}
            compact={sidebar || mobileSheet}
          />
        : subcategories && subcategories.length > 0 ?
          <div
            className={cn(
              sidebar || mobileSheet ?
                "overflow-hidden border border-gray-100/90 bg-[#faf8f5]/50 p-1"
              : "",
            )}
          >
            {(sidebar || mobileSheet) ?
              <p className="px-2.5 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Shop by type
              </p>
            : null}
            <CollectionSubcategoryRows
              items={subcategories
                .map((sub: { name?: string; slug?: string } | string) =>
                  typeof sub === "string" ?
                    { name: sub }
                  : { name: sub.name || "", slug: sub.slug },
                )
                .filter((s) => s.name)}
              filters={filters}
              onUpdateFilter={onUpdateFilter}
              compact={sidebar || mobileSheet}
            />
          </div>
        : <p className="text-[13px] text-gray-400">No collections available</p>}
      </FilterColumn>

      <FilterColumn
        title="Color"
        sidebar={sidebar}
        mobileSheet={mobileSheet}
        {...accordionProps("color")}
      >
        {colors.length > 0 ?
          filterCheckboxList(colors, filters.colors, "colors")
        : <p className="text-sm text-gray-400">No colors available</p>}
      </FilterColumn>

      <FilterColumn
        title="Occasion"
        sidebar={sidebar}
        mobileSheet={mobileSheet}
        {...accordionProps("occasion")}
      >
        {occasions.length > 0 ?
          filterCheckboxList(occasions, filters.occasions, "occasions")
        : <p className="text-sm text-gray-400">No occasions available</p>}
      </FilterColumn>

      <FilterColumn
        title="Rating"
        sidebar={sidebar}
        mobileSheet={mobileSheet}
        {...accordionProps("rating")}
      >
        <ul className={cn("space-y-1", sidebar ? "" : "space-y-2 text-sm")}>
          {[4, 3, 2, 1].map((r) => {
            const selected = isShopListFilterSelected(
              filters.ratings,
              String(r),
            );
            return (
              <li key={r}>
                <label
                  className={cn(
                    sidebar ?
                      sidebarFilterOptionClass(selected)
                    : cn(
                        "flex cursor-pointer items-center gap-2 transition-colors",
                        selected ?
                          "font-medium text-[#c5a059]"
                        : "text-gray-600 hover:text-[#c5a059]",
                      ),
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

      <FilterColumn
        title="Price"
        sidebar={sidebar}
        mobileSheet={mobileSheet}
        {...accordionProps("price")}
      >
        <ShopPriceRangeFilter
          minPrice={draftMinPrice}
          maxPrice={draftMaxPrice}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
        />
        {sidebar && onApply && pricePending ?
          <button
            type="button"
            onClick={onApply}
            className="mt-3 w-full bg-navy-900 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition-colors hover:bg-navy-800"
          >
            Apply price
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
  pricePending = false,
  className,
}: {
  onApply: () => void;
  onClear: () => void;
  showClear: boolean;
  pricePending?: boolean;
  className?: string;
}) {
  const applyLabel =
    pricePending ? "Apply filters" : "Done";

  return (
    <div
      className={cn(
        "border-t border-[#c5a059]/25 bg-white/98 px-4 py-3.5 backdrop-blur-md shadow-[0_-8px_28px_rgba(0,13,33,0.08)] sm:px-6",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl gap-2.5",
          showClear ? "grid grid-cols-2" : "justify-stretch",
        )}
      >
        {showClear ?
          <button
            type="button"
            onClick={onClear}
            className="h-11 border border-gray-200/90 bg-white text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-700 transition-all duration-200 hover:border-[#c5a059]/50 hover:text-[#c5a059] active:scale-[0.99]"
          >
            Clear all
          </button>
        : null}
        <button
          type="button"
          onClick={onApply}
          className={cn(
            "h-11 bg-navy-900 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition-all duration-200 hover:bg-navy-800 active:scale-[0.99]",
            showClear ? "w-full" : "w-full",
          )}
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
}

function FilterColumn({
  title,
  children,
  defaultOpen = false,
  sidebar = false,
  mobileSheet = false,
  accordion = false,
  isOpen: isOpenControlled,
  onToggle,
  hasActiveSelection = false,
  onClearSection,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sidebar?: boolean;
  mobileSheet?: boolean;
  accordion?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  hasActiveSelection?: boolean;
  onClearSection?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = accordion ? Boolean(isOpenControlled) : internalOpen;
  const useCompactAccordion = sidebar || (mobileSheet && accordion);

  const handleToggle = () => {
    if (accordion) {
      onToggle?.();
      return;
    }
    setInternalOpen((o) => !o);
  };

  if (useCompactAccordion) {
    const accentActive = isOpen || hasActiveSelection;
    return (
      <div
        className={cn(
          "overflow-hidden border transition-all duration-200",
          isOpen ?
            "border-[#c5a059]/25 bg-white shadow-[0_4px_16px_rgba(0,13,33,0.05)]"
          : hasActiveSelection ?
            "border-[#c5a059]/20 bg-white/80"
          : "border-navy-950/[0.06] bg-white/50 hover:border-[#c5a059]/15 hover:bg-white/90",
        )}
      >
        <div className="flex w-full items-center gap-2.5 px-2.5 py-2.5">
          <span
            className={cn(
              "h-7 w-0.5 shrink-0 transition-colors duration-200",
              accentActive ? "bg-[#c5a059]" : "bg-navy-900/10",
            )}
            aria-hidden
          />
          <button
            type="button"
            onClick={handleToggle}
            className="min-w-0 flex-1 text-left"
            aria-expanded={isOpen}
          >
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-900">
              {title}
            </h4>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            {onClearSection ?
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSection();
                }}
                className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c5a059] transition-colors hover:text-[#a68648]"
              >
                Clear
              </button>
            : null}
            <button
              type="button"
              onClick={handleToggle}
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center border transition-colors",
                isOpen ?
                  "border-[#c5a059]/30 bg-[#c5a059]/10 text-[#c5a059]"
                : "border-navy-900/10 bg-[#faf8f5] text-navy-900/50",
              )}
              aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300 ease-out",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>
        {isOpen ?
          <div className="overflow-x-hidden border-t border-[#c5a059]/10 px-2 pb-2.5 pt-2 animate-in fade-in duration-200">
            {children}
          </div>
        : null}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 pb-5 sm:border-0 sm:pb-0">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between text-left sm:cursor-default"
        tabIndex={0}
      >
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5a059] sm:mb-4">
          {title}
        </h4>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#c5a059] transition-transform duration-200 sm:hidden",
            isOpen ? "rotate-180" : "",
          )}
          aria-hidden
        />
      </button>
      <div className={cn("mt-5 sm:mt-0", isOpen ? "block" : "hidden sm:block")}>
        {children}
      </div>
    </div>
  );
}
