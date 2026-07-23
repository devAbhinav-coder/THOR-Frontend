import { ReadonlyURLSearchParams } from "next/navigation";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";
import { SEARCH_QUERY_MAX_LEN } from "@/lib/searchQueryParser";

export const SHOP_SEARCH_MAX_LEN = SEARCH_QUERY_MAX_LEN;
export const SHOP_DEFAULT_SORT = "-createdAt";
export const SHOP_PAGE_LIMIT = 12;
export const SHOP_PRICE_FILTER_MIN = 499;
export const SHOP_PRICE_FILTER_MAX = 3500;

export function normalizeShopSortValue(sort: string): string {
  const trimmed = String(sort || "").trim();
  if (!trimmed || trimmed === "featured") return SHOP_DEFAULT_SORT;
  if (trimmed === "-ratings.count" || trimmed === "ratings.count") {
    return trimmed.startsWith("-") ? "-soldCount" : "soldCount";
  }
  return trimmed;
}

export function resolveShopSortForApi(sort: string): {
  listSort: string;
  searchSortBy: string;
  searchSortOrder: "asc" | "desc";
} {
  const normalized = normalizeShopSortValue(sort);
  switch (normalized) {
    case "price":
      return { listSort: "price", searchSortBy: "price", searchSortOrder: "asc" };
    case "-price":
      return { listSort: "-price", searchSortBy: "price", searchSortOrder: "desc" };
    case "-ratings.average":
      return {
        listSort: "-ratings.average",
        searchSortBy: "ratings.average",
        searchSortOrder: "desc",
      };
    case "-soldCount":
      return { listSort: "-soldCount", searchSortBy: "soldCount", searchSortOrder: "desc" };
    case "soldCount":
      return { listSort: "soldCount", searchSortBy: "soldCount", searchSortOrder: "asc" };
    case "-createdAt":
    default:
      return {
        listSort: "-createdAt",
        searchSortBy: "createdAt",
        searchSortOrder: "desc",
      };
  }
}

export type ShopFilters = {
  categories: string[];
  subcategories: string[];
  occasions: string[];
  fabrics: string[];
  colors: string[];
  minPrice: string;
  maxPrice: string;
  ratings: string[];
  sort: string;
  search: string;
  isFeatured: string;
  onSale: string;
  hasOffer: string;
};

export type ShopCategoryContext = {
  name: string;
  slug: string;
  subcategory?: { name: string; slug: string };
  description?: string;
} | null;

export type ShopMultiFilterKey =
  | "categories"
  | "colors"
  | "fabrics"
  | "ratings"
  | "subcategories"
  | "occasions";

export const EMPTY_SHOP_FILTERS: ShopFilters = {
  categories: [],
  subcategories: [],
  occasions: [],
  fabrics: [],
  colors: [],
  minPrice: "",
  maxPrice: "",
  ratings: [],
  sort: SHOP_DEFAULT_SORT,
  search: "",
  isFeatured: "",
  onSale: "",
  hasOffer: "",
};

type SearchParamsLike =
  | ReadonlyURLSearchParams
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readScalarParam(source: SearchParamsLike, key: string): string {
  if (source instanceof URLSearchParams || "get" in source) {
    return String((source as URLSearchParams).get(key) || "").trim();
  }
  const raw = (source as Record<string, string | string[] | undefined>)[key];
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim();
  return "";
}

function readListParam(source: SearchParamsLike, ...keys: string[]): string[] {
  const values: string[] = [];
  for (const key of keys) {
    if (source instanceof URLSearchParams || "get" in source) {
      const sp = source as URLSearchParams;
      const all = sp.getAll(key);
      if (all.length) {
        for (const entry of all) {
          for (const part of String(entry).split(",")) {
            const trimmed = part.trim();
            if (trimmed) values.push(trimmed);
          }
        }
        continue;
      }
      const single = sp.get(key);
      if (single) {
        for (const part of single.split(",")) {
          const trimmed = part.trim();
          if (trimmed) values.push(trimmed);
        }
      }
      continue;
    }
    const raw = (source as Record<string, string | string[] | undefined>)[key];
    if (typeof raw === "string") {
      for (const part of raw.split(",")) {
        const trimmed = part.trim();
        if (trimmed) values.push(trimmed);
      }
    } else if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (typeof entry !== "string") continue;
        for (const part of entry.split(",")) {
          const trimmed = part.trim();
          if (trimmed) values.push(trimmed);
        }
      }
    }
  }
  return dedupeShopFilterValues(values);
}

export function isSameShopFilterValue(a: string, b: string): boolean {
  const norm = (s: string) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  return norm(a) === norm(b);
}

export function dedupeShopFilterValues(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function isShopListFilterSelected(
  list: string[],
  value: string,
): boolean {
  return list.some((item) => isSameShopFilterValue(item, value));
}

export function isShopCategoryFilterSelected(
  categories: string[],
  categoryName: string,
): boolean {
  const wantedSlug = toShopCategorySlug(categoryName);
  if (!wantedSlug) return false;
  return categories.some((c) => toShopCategorySlug(c) === wantedSlug);
}

export function toggleShopCategoryFilter(
  filters: ShopFilters,
  categoryName: string,
): ShopFilters {
  const trimmed = String(categoryName || "").trim();
  if (!trimmed) return filters;
  const wantedSlug = toShopCategorySlug(trimmed);
  const without = filters.categories.filter(
    (c) => toShopCategorySlug(c) !== wantedSlug,
  );
  const wasSelected = filters.categories.some(
    (c) => toShopCategorySlug(c) === wantedSlug,
  );
  if (wasSelected) {
    return { ...filters, categories: dedupeShopFilterValues(without) };
  }
  return {
    ...filters,
    categories: dedupeShopFilterValues([...without, trimmed]),
  };
}

export function toggleShopListFilter(
  filters: ShopFilters,
  key: ShopMultiFilterKey,
  value: string,
): ShopFilters {
  const trimmed = String(value || "").trim();
  if (!trimmed) return filters;
  const list = [...filters[key]];
  const index = list.findIndex((item) => isSameShopFilterValue(item, trimmed));
  if (index >= 0) list.splice(index, 1);
  else list.push(trimmed);
  return { ...filters, [key]: dedupeShopFilterValues(list) };
}

export function mergeCategoryContextFilters(
  filters: ShopFilters,
  categoryContext: ShopCategoryContext = null,
): ShopFilters {
  if (!categoryContext?.name) return filters;
  const categories = [...filters.categories];
  const hasContext = categories.some((c) =>
    isSameShopFilterValue(c, categoryContext.name),
  );
  if (!hasContext && categories.length === 0) {
    categories.push(categoryContext.name);
  }
  return { ...filters, categories: dedupeShopFilterValues(categories) };
}

export function parseShopFiltersFromUrl(
  searchParams: SearchParamsLike,
  categoryContext: ShopCategoryContext = null,
): ShopFilters {
  const categories = readListParam(searchParams, "categories", "category");
  const subcategories = readListParam(searchParams, "subcategories", "subcategory");
  const occasions = readListParam(searchParams, "occasions", "occasion");
  const fabrics = readListParam(searchParams, "fabrics", "fabric");
  const colors = readListParam(searchParams, "colors", "color");
  const ratings = readListParam(searchParams, "ratings", "rating", "minRating");

  const parsed: ShopFilters = {
    categories:
      categories.length > 0 ?
        categories
      : categoryContext?.slug ?
        [
          categoryContext.name,
        ]
      : [],
    subcategories:
      subcategories.length > 0 ?
        subcategories
      : categoryContext?.subcategory ?
        [categoryContext.subcategory.name]
      : [],
    occasions,
    fabrics,
    colors,
    minPrice: readScalarParam(searchParams, "minPrice"),
    maxPrice: readScalarParam(searchParams, "maxPrice"),
    ratings: ratings.filter((r) => /^[1-5]$/.test(r)),
    sort: normalizeShopSortValue(
      readScalarParam(searchParams, "sort") || SHOP_DEFAULT_SORT,
    ),
    search: readScalarParam(searchParams, "search")
      .replace(/\s*[·•|,]+\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, SHOP_SEARCH_MAX_LEN),
    isFeatured: readScalarParam(searchParams, "isFeatured"),
    onSale: readScalarParam(searchParams, "onSale"),
    hasOffer: readScalarParam(searchParams, "hasOffer"),
  };

  return mergeCategoryContextFilters(parsed, categoryContext);
}

export const SHOP_COLLECTIONS_PATH = "/shop/collections";

export function getShopRouteBasePath(
  categoryContext: ShopCategoryContext = null,
): string {
  if (!categoryContext?.slug) return SHOP_COLLECTIONS_PATH;
  return `${SHOP_COLLECTIONS_PATH}/${encodeURIComponent(categoryContext.slug)}`;
}

export function buildShopQueryString(
  filters: ShopFilters,
  options: { omitCategories?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (!options.omitCategories && filters.categories.length) {
    params.set("categories", filters.categories.join(","));
  }
  if (filters.subcategories.length) {
    params.set("subcategories", filters.subcategories.join(","));
  }
  if (filters.occasions.length) {
    params.set("occasions", filters.occasions.join(","));
  }
  if (filters.fabrics.length) {
    params.set("fabrics", filters.fabrics.join(","));
  }
  if (filters.colors.length) {
    params.set("colors", filters.colors.join(","));
  }
  if (filters.ratings.length) {
    params.set("ratings", filters.ratings.join(","));
  }
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.search) params.set("search", filters.search);
  if (filters.isFeatured) params.set("isFeatured", filters.isFeatured);
  if (filters.onSale) params.set("onSale", filters.onSale);
  if (filters.hasOffer) params.set("hasOffer", filters.hasOffer);
  if (filters.sort && filters.sort !== SHOP_DEFAULT_SORT) {
    params.set("sort", filters.sort);
  }
  return params.toString();
}

export function hasSecondaryShopFilters(filters: ShopFilters): boolean {
  return (
    filters.subcategories.length > 0 ||
    filters.occasions.length > 0 ||
    filters.fabrics.length > 0 ||
    filters.colors.length > 0 ||
    filters.ratings.length > 0 ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.search) ||
    Boolean(filters.isFeatured) ||
    Boolean(filters.onSale) ||
    Boolean(filters.hasOffer) ||
    filters.sort !== SHOP_DEFAULT_SORT
  );
}

export function shouldUseCategoryPath(filters: ShopFilters): boolean {
  return (
    filters.categories.length === 1 &&
    filters.subcategories.length === 0 &&
    filters.occasions.length === 0 &&
    filters.fabrics.length === 0 &&
    filters.colors.length === 0 &&
    !filters.minPrice &&
    !filters.maxPrice &&
    filters.ratings.length === 0 &&
    !filters.search &&
    !filters.isFeatured &&
    !filters.onSale &&
    !filters.hasOffer &&
    filters.sort === SHOP_DEFAULT_SORT
  );
}

export function shouldUseSubcategoryPath(filters: ShopFilters): boolean {
  return (
    filters.categories.length === 1 &&
    filters.subcategories.length === 1 &&
    filters.occasions.length === 0 &&
    filters.fabrics.length === 0 &&
    filters.colors.length === 0 &&
    !filters.minPrice &&
    !filters.maxPrice &&
    filters.ratings.length === 0 &&
    !filters.search &&
    !filters.isFeatured &&
    !filters.onSale &&
    !filters.hasOffer &&
    filters.sort === SHOP_DEFAULT_SORT
  );
}

export function countActiveShopFilters(
  filters: ShopFilters,
  categoryContext: ShopCategoryContext = null,
): number {
  let count = 0;
  const categoryCount =
    categoryContext ?
      filters.categories.filter(
        (c) => !isSameShopFilterValue(c, categoryContext.name),
      ).length
    : filters.categories.length;
  count += categoryCount;
  count += filters.subcategories.length;
  count += filters.occasions.length;
  count += filters.fabrics.length;
  count += filters.colors.length;
  count += filters.ratings.length;
  if (filters.minPrice) count += 1;
  if (filters.maxPrice) count += 1;
  if (filters.search) count += 1;
  if (filters.onSale) count += 1;
  if (filters.hasOffer) count += 1;
  return count;
}

/** Show "Clear all" when anything is filtered vs plain /shop. */
export function shouldShowClearShopFilters(
  filters: ShopFilters,
  categoryContext: ShopCategoryContext = null,
): boolean {
  if (categoryContext) return true;
  if (filters.categories.length > 0) return true;
  return hasSecondaryShopFilters(filters);
}

export function resolveShopFilterNavigation(
  filters: ShopFilters,
  key: keyof ShopFilters,
  value: string | number,
  categoryContext: ShopCategoryContext = null,
): string {
  return resolveCanonicalShopUrl(
    resolveNextShopFilters(filters, key, value),
    categoryContext,
  );
}

export function resolveNextShopFilters(
  filters: ShopFilters,
  key: keyof ShopFilters,
  value: string | number,
): ShopFilters {
  if (key === "categories") {
    return toggleShopCategoryFilter(filters, String(value));
  }
  if (
    key === "colors" ||
    key === "fabrics" ||
    key === "ratings" ||
    key === "subcategories" ||
    key === "occasions"
  ) {
    return toggleShopListFilter(filters, key, String(value));
  }
  if (key === "onSale") {
    return {
      ...filters,
      onSale: filters.onSale === "true" ? "" : "true",
    };
  }
  if (key === "hasOffer") {
    return {
      ...filters,
      hasOffer: filters.hasOffer === "true" ? "" : "true",
    };
  }
  return { ...filters, [key]: String(value) };
}

export function resolveClearShopFiltersNavigation(): {
  path: string;
  filters: ShopFilters;
} {
  return { path: SHOP_COLLECTIONS_PATH, filters: { ...EMPTY_SHOP_FILTERS } };
}

function joinFilterLabels(values: string[], fallback: string): string {
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} & ${values[1]}`;
  return `${values[0]} +${values.length - 1} more`;
}

export function formatShopCategoriesLabel(categories: string[]): string {
  return joinFilterLabels(categories, "");
}

export function formatShopSubcategoriesLabel(subcategories: string[]): string {
  return joinFilterLabels(subcategories, "");
}

export function formatShopColorsLabel(colors: string[]): string {
  return joinFilterLabels(colors, "");
}

function clampShopPrice(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function resolveShopPriceDraft(
  minPrice: string,
  maxPrice: string,
): { min: number; max: number } {
  const min = clampShopPrice(
    minPrice ? Number(minPrice) : SHOP_PRICE_FILTER_MIN,
    SHOP_PRICE_FILTER_MIN,
    SHOP_PRICE_FILTER_MAX,
  );
  const max = clampShopPrice(
    maxPrice ? Number(maxPrice) : SHOP_PRICE_FILTER_MAX,
    SHOP_PRICE_FILTER_MIN,
    SHOP_PRICE_FILTER_MAX,
  );
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
}

export function shopPriceDraftToFilterStrings(
  min: number,
  max: number,
): { minPrice: string; maxPrice: string } {
  const atFullRange =
    min <= SHOP_PRICE_FILTER_MIN && max >= SHOP_PRICE_FILTER_MAX;
  if (atFullRange) return { minPrice: "", maxPrice: "" };
  return { minPrice: String(min), maxPrice: String(max) };
}

export function resolveEffectiveMinRating(ratings: string[]): number | undefined {
  const nums = ratings
    .map((r) => Number.parseInt(r, 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
  if (!nums.length) return undefined;
  return Math.min(...nums);
}

export function buildShopProductQueryParams(
  filters: ShopFilters,
  page: number,
  limit: number = SHOP_PAGE_LIMIT,
  categoryContext: ShopCategoryContext = null,
): {
  mode: "search" | "list";
  params: Record<string, string | number>;
} {
  const effective = mergeCategoryContextFilters(filters, categoryContext);
  const search = effective.search.trim().slice(0, SHOP_SEARCH_MAX_LEN);
  const minRating = resolveEffectiveMinRating(effective.ratings);
  const sortParams = resolveShopSortForApi(effective.sort);

  if (search) {
    const params: Record<string, string | number> = {
      q: search,
      page,
      limit,
      sortBy: sortParams.searchSortBy,
      sortOrder: sortParams.searchSortOrder,
    };

    if (effective.categories.length) {
      params.categories = effective.categories.join(",");
    }
    if (effective.subcategories.length) {
      params.subcategories = effective.subcategories.join(",");
    }
    if (effective.colors.length) {
      params.colors = effective.colors.join(",");
    }
    if (effective.fabrics.length) {
      params.fabrics = effective.fabrics.join(",");
    }
    if (effective.occasions.length) {
      params.occasions = effective.occasions.join(",");
    }
    if (minRating !== undefined) params.minRating = minRating;
    if (effective.minPrice) params.minPrice = Number(effective.minPrice);
    if (effective.maxPrice) params.maxPrice = Number(effective.maxPrice);
    if (effective.isFeatured) params.isFeatured = effective.isFeatured;
    if (effective.onSale) params.onSale = effective.onSale;
    if (effective.hasOffer) params.hasOffer = effective.hasOffer;

    return { mode: "search", params };
  }

  const params: Record<string, string | number> = {
    sort: sortParams.listSort,
    page,
    limit,
  };

  if (effective.categories.length === 0 && !hasSecondaryShopFilters(effective)) {
    params.isRandom = "true";
  }
  if (effective.categories.length) {
    params.categories = effective.categories.join(",");
  }
  if (effective.subcategories.length) {
    params.subcategories = effective.subcategories.join(",");
  }
  if (effective.colors.length) {
    params.colors = effective.colors.join(",");
  }
  if (effective.fabrics.length) {
    params.fabrics = effective.fabrics.join(",");
  }
  if (effective.occasions.length) {
    params.occasions = effective.occasions.join(",");
  }
  if (minRating !== undefined) params.minRating = minRating;
  if (effective.minPrice) params["price[gte]"] = effective.minPrice;
  if (effective.maxPrice) params["price[lte]"] = effective.maxPrice;
  if (effective.isFeatured) params.isFeatured = effective.isFeatured;
  if (effective.onSale) params.onSale = effective.onSale;
  if (effective.hasOffer) params.hasOffer = effective.hasOffer;

  return { mode: "list", params };
}

export function resolveCanonicalShopUrl(
  filters: ShopFilters,
  categoryContext: ShopCategoryContext = null,
): string {
  const catSlug =
    toShopCategorySlug(filters.categories[0]) || categoryContext?.slug;

  if (shouldUseSubcategoryPath(filters) && catSlug) {
    const subSlug =
      categoryContext?.subcategory?.slug ||
      toShopCategorySlug(filters.subcategories[0]);
    if (subSlug) {
      return `${SHOP_COLLECTIONS_PATH}/${encodeURIComponent(catSlug)}/${encodeURIComponent(subSlug)}`;
    }
  }

  // Use explicit filter state only — do not re-inject route category (breaks uncheck).
  if (filters.categories.length === 1 && hasSecondaryShopFilters(filters) && catSlug) {
    const qs = buildShopQueryString(filters, { omitCategories: true });
    const base = `${SHOP_COLLECTIONS_PATH}/${encodeURIComponent(catSlug)}`;
    return qs ? `${base}?${qs}` : base;
  }

  if (shouldUseCategoryPath(filters) && catSlug) {
    return `${SHOP_COLLECTIONS_PATH}/${encodeURIComponent(catSlug)}`;
  }

  const qs = buildShopQueryString(filters);
  return qs ? `${SHOP_COLLECTIONS_PATH}?${qs}` : SHOP_COLLECTIONS_PATH;
}
