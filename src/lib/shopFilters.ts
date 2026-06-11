import { ReadonlyURLSearchParams } from "next/navigation";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";

export const SHOP_SEARCH_MAX_LEN = 30;
export const SHOP_DEFAULT_SORT = "-createdAt";
export const SHOP_PAGE_LIMIT = 12;
export const SHOP_PRICE_FILTER_MIN = 499;
export const SHOP_PRICE_FILTER_MAX = 10000;

export type ShopFilters = {
  categories: string[];
  fabrics: string[];
  minPrice: string;
  maxPrice: string;
  ratings: string[];
  sort: string;
  search: string;
  isFeatured: string;
};

export type ShopCategoryContext = {
  name: string;
  slug: string;
  description?: string;
} | null;

export type ShopMultiFilterKey = "categories" | "fabrics" | "ratings";

export const EMPTY_SHOP_FILTERS: ShopFilters = {
  categories: [],
  fabrics: [],
  minPrice: "",
  maxPrice: "",
  ratings: [],
  sort: SHOP_DEFAULT_SORT,
  search: "",
  isFeatured: "",
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
  return (
    String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase()
  );
}

export function dedupeShopFilterValues(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
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
  const fabrics = readListParam(searchParams, "fabrics", "fabric");
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
    fabrics,
    minPrice: readScalarParam(searchParams, "minPrice"),
    maxPrice: readScalarParam(searchParams, "maxPrice"),
    ratings: ratings.filter((r) => /^[1-5]$/.test(r)),
    sort: readScalarParam(searchParams, "sort") || SHOP_DEFAULT_SORT,
    search: readScalarParam(searchParams, "search").slice(0, SHOP_SEARCH_MAX_LEN),
    isFeatured: readScalarParam(searchParams, "isFeatured"),
  };

  return mergeCategoryContextFilters(parsed, categoryContext);
}

export function getShopRouteBasePath(
  categoryContext: ShopCategoryContext = null,
): string {
  if (!categoryContext?.slug) return "/shop";
  return `/shop/category/${encodeURIComponent(categoryContext.slug)}`;
}

export function buildShopQueryString(
  filters: ShopFilters,
  options: { omitCategories?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (!options.omitCategories && filters.categories.length) {
    params.set("categories", filters.categories.join(","));
  }
  if (filters.fabrics.length) {
    params.set("fabrics", filters.fabrics.join(","));
  }
  if (filters.ratings.length) {
    params.set("ratings", filters.ratings.join(","));
  }
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.search) params.set("search", filters.search);
  if (filters.isFeatured) params.set("isFeatured", filters.isFeatured);
  if (filters.sort && filters.sort !== SHOP_DEFAULT_SORT) {
    params.set("sort", filters.sort);
  }
  return params.toString();
}

export function hasSecondaryShopFilters(filters: ShopFilters): boolean {
  return (
    filters.fabrics.length > 0 ||
    filters.ratings.length > 0 ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.search) ||
    Boolean(filters.isFeatured) ||
    filters.sort !== SHOP_DEFAULT_SORT
  );
}

export function shouldUseCategoryPath(filters: ShopFilters): boolean {
  return (
    filters.categories.length === 1 &&
    filters.fabrics.length === 0 &&
    !filters.minPrice &&
    !filters.maxPrice &&
    filters.ratings.length === 0 &&
    !filters.search &&
    !filters.isFeatured &&
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
  count += filters.fabrics.length;
  count += filters.ratings.length;
  if (filters.minPrice) count += 1;
  if (filters.maxPrice) count += 1;
  if (filters.search) count += 1;
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
  let next: ShopFilters = filters;

  if (key === "categories") {
    next = toggleShopCategoryFilter(filters, String(value));
  } else if (key === "fabrics" || key === "ratings") {
    next = toggleShopListFilter(filters, key, String(value));
  } else {
    next = { ...filters, [key]: String(value) };
  }

  return resolveCanonicalShopUrl(next, categoryContext);
}

export function resolveClearShopFiltersNavigation(): {
  path: string;
  filters: ShopFilters;
} {
  return { path: "/shop", filters: { ...EMPTY_SHOP_FILTERS } };
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

export function formatShopFabricsLabel(fabrics: string[]): string {
  return joinFilterLabels(fabrics, "");
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

  if (search) {
    const params: Record<string, string | number> = {
      q: search,
      page,
      limit,
    };

    if (effective.sort === "price") params.sortBy = "price";
    else if (effective.sort === "-price") {
      params.sortBy = "price";
      params.sortOrder = "desc";
    } else if (effective.sort === "-ratings.average") {
      params.sortBy = "ratings.average";
    } else if (effective.sort === "-ratings.count") {
      params.sortBy = "soldCount";
    } else {
      params.sortBy = "relevance";
    }

    if (effective.categories.length) {
      params.categories = effective.categories.join(",");
    }
    if (effective.fabrics.length) {
      params.fabrics = effective.fabrics.join(",");
    }
    if (minRating !== undefined) params.minRating = minRating;
    if (effective.minPrice) params.minPrice = Number(effective.minPrice);
    if (effective.maxPrice) params.maxPrice = Number(effective.maxPrice);
    if (effective.isFeatured) params.isFeatured = effective.isFeatured;

    return { mode: "search", params };
  }

  const params: Record<string, string | number> = {
    sort: effective.sort,
    page,
    limit,
  };
  if (effective.categories.length) {
    params.categories = effective.categories.join(",");
  }
  if (effective.fabrics.length) {
    params.fabrics = effective.fabrics.join(",");
  }
  if (minRating !== undefined) params.minRating = minRating;
  if (effective.minPrice) params["price[gte]"] = effective.minPrice;
  if (effective.maxPrice) params["price[lte]"] = effective.maxPrice;
  if (effective.isFeatured) params.isFeatured = effective.isFeatured;

  return { mode: "list", params };
}

export function resolveCanonicalShopUrl(
  filters: ShopFilters,
  categoryContext: ShopCategoryContext = null,
): string {
  // Use explicit filter state only — do not re-inject route category (breaks uncheck).
  if (filters.categories.length === 1 && hasSecondaryShopFilters(filters)) {
    const slug =
      toShopCategorySlug(filters.categories[0]) || categoryContext?.slug;
    if (slug) {
      const qs = buildShopQueryString(filters, { omitCategories: true });
      const base = `/shop/category/${encodeURIComponent(slug)}`;
      return qs ? `${base}?${qs}` : base;
    }
  }

  if (shouldUseCategoryPath(filters)) {
    const slug = toShopCategorySlug(filters.categories[0]);
    if (slug) return `/shop/category/${encodeURIComponent(slug)}`;
  }

  const qs = buildShopQueryString(filters);
  return qs ? `/shop?${qs}` : "/shop";
}
