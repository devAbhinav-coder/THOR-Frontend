/** Desktop filter column — scrolls with the page (not sticky). */
export const SHOP_FILTER_SIDEBAR_ASIDE_CLASS =
  "hidden lg:block lg:min-w-0 lg:self-start";

/** @deprecated Renamed — use SHOP_FILTER_SIDEBAR_ASIDE_CLASS */
export const SHOP_FILTER_SIDEBAR_STICKY_CLASS = SHOP_FILTER_SIDEBAR_ASIDE_CLASS;

/** Panel surface — sharp corners, tight top spacing. */
export const SHOP_FILTER_SIDEBAR_PANEL_CLASS =
  "min-w-0 overflow-x-hidden border border-[#c5a059]/15 bg-gradient-to-b from-[#fcfbf9] via-white to-[#faf8f5] px-3 pb-3 pt-2 shadow-[0_8px_28px_rgba(0,13,33,0.05)] ring-1 ring-navy-950/[0.04]";

/** @deprecated Inner scroll removed; page scrolls the full column. */
export const SHOP_FILTER_SIDEBAR_SCROLL_CLASS = "min-w-0 overflow-x-hidden";

/** @deprecated */
export const SHOP_FILTER_SIDEBAR_CLASS =
  `${SHOP_FILTER_SIDEBAR_ASIDE_CLASS} ${SHOP_FILTER_SIDEBAR_PANEL_CLASS}`;

/** Shared shop listing grid - keep skeleton + live grid in sync. */
export const SHOP_PRODUCT_GRID_CLASS =
  "grid grid-cols-2 items-stretch gap-y-2 gap-x-1 sm:gap-y-2 sm:gap-x-2 lg:grid-cols-4 lg:gap-x-3 [&>*]:h-full [&>*]:min-h-0";

/** Initial / filter-refetch skeleton cards (2 mobile rows). */
export const SHOP_INITIAL_SKELETON_COUNT = 4;

/** Append skeletons while infinite scroll loads the next page. */
export const SHOP_LOAD_MORE_SKELETON_COUNT = 4;
