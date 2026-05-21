import type { Product } from "@/types";

type ProductListPage = {
  data?: { products?: Product[] };
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    total?: number;
    totalProducts?: number;
    hasNextPage?: boolean;
  };
};

function batchProducts(page: ProductListPage): Product[] {
  return (page.data?.products ?? []) as Product[];
}

function countLoadedProducts(allPages: ProductListPage[]): number {
  return allPages.reduce((n, pg) => n + batchProducts(pg).length, 0);
}

/**
 * Numeric page cursor (shop catalog, gifting non-relevance).
 * Prefers explicit `hasNextPage` from API; falls back to batch size vs total.
 */
export function getNextNumericPage(
  lastPage: unknown,
  allPages: unknown[],
  pageSize: number,
): number | undefined {
  const page = lastPage as ProductListPage;
  const pages = allPages as ProductListPage[];
  const p = page.pagination;
  const cur = p?.currentPage ?? 1;
  const batch = batchProducts(page);
  const total = p?.total ?? p?.totalProducts ?? 0;
  const loadedSoFar = countLoadedProducts(pages);

  if (p?.hasNextPage === false) return undefined;
  if (p?.hasNextPage === true) return cur + 1;

  const totalPages = Math.max(1, p?.totalPages ?? 1);
  if (cur < totalPages) return cur + 1;

  if (batch.length >= pageSize && loadedSoFar < total) return cur + 1;

  return undefined;
}

/**
 * excludeIds cursor for random product pools (home explore, gifting relevance).
 */
export function getNextExcludeIdsParam(
  lastPage: unknown,
  allPages: unknown[],
  pageSize: number,
): string | undefined {
  const page = lastPage as ProductListPage;
  const pages = allPages as ProductListPage[];
  const p = page.pagination;
  const batch = batchProducts(page);
  const seenIds = pages
    .flatMap((pg) => batchProducts(pg))
    .map((prod) => prod._id)
    .filter(Boolean);

  if (!batch.length && seenIds.length > 0) return undefined;
  if (p?.hasNextPage === false) return undefined;

  const total = p?.total ?? 0;
  const loaded = seenIds.length;
  const excludeIds = seenIds.join(",");

  if (p?.hasNextPage === true) return excludeIds || undefined;

  if (batch.length >= pageSize && loaded < total) return excludeIds || undefined;
  if (loaded < total && batch.length > 0) return excludeIds || undefined;

  return undefined;
}

export function getNextGiftingPageParam(
  lastPage: unknown,
  allPages: unknown[],
  pageSize: number,
  sortByRelevance: boolean,
): { page: number; excludeIds: string } | undefined {
  const page = lastPage as ProductListPage;
  const pages = allPages as ProductListPage[];
  if (sortByRelevance) {
    const excludeIds = getNextExcludeIdsParam(lastPage, allPages, pageSize);
    if (!excludeIds) return undefined;
    const cur = page.pagination?.currentPage ?? 1;
    return { page: cur + 1, excludeIds };
  }

  const nextPage = getNextNumericPage(lastPage, allPages, pageSize);
  if (nextPage === undefined) return undefined;

  const excludeIds = pages
    .flatMap((pg) => batchProducts(pg))
    .map((prod) => prod._id)
    .join(",");

  return { page: nextPage, excludeIds };
}
