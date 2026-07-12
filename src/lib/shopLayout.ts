/** Shared shop listing grid — keep skeleton + live grid in sync. */
export const SHOP_PRODUCT_GRID_CLASS =
  "grid grid-cols-2 items-stretch gap-y-2 gap-x-1 sm:gap-y-2 sm:gap-x-2 lg:grid-cols-4 lg:gap-x-3 [&>*]:h-full [&>*]:min-h-0";

/** Initial / filter-refetch skeleton cards (2 mobile rows). */
export const SHOP_INITIAL_SKELETON_COUNT = 4;

/** Append skeletons while infinite scroll loads the next page. */
export const SHOP_LOAD_MORE_SKELETON_COUNT = 4;
