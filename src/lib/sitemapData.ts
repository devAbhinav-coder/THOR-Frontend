import { getBuildSafeApiBase } from "@/lib/buildApiBase";

type PaginatedResponse<T> = {
  data?: Record<string, T[] | undefined>;
  pagination?: {
    totalPages?: number;
    hasNextPage?: boolean;
    currentPage?: number;
  };
};

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

async function fetchPaginatedList<T>(
  basePath: string,
  listKey: string,
): Promise<T[]> {
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) return [];

  const all: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const res = await fetch(`${apiUrl}${basePath}?limit=${PAGE_SIZE}&page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;

    const json = (await res.json()) as PaginatedResponse<T>;
    const chunk = json?.data?.[listKey];
    if (Array.isArray(chunk)) all.push(...chunk);

    totalPages = Math.max(1, Number(json?.pagination?.totalPages || 1));
    const hasNext = json?.pagination?.hasNextPage ?? page < totalPages;
    if (!hasNext) break;
    page += 1;
  }

  return all;
}

export function fetchAllSitemapProducts() {
  return fetchPaginatedList<{ slug?: string; updatedAt?: string; name?: string; images?: { url?: string }[] }>(
    "/products",
    "products",
  );
}

export function fetchAllSitemapBlogs() {
  return fetchPaginatedList<{ slug?: string; updatedAt?: string; viewCount?: number }>(
    "/blogs",
    "blogs",
  );
}

export function fetchAllSitemapGiftingProducts() {
  return fetchPaginatedList<{ slug?: string; updatedAt?: string; images?: { url?: string }[] }>(
    "/gifting/products",
    "products",
  );
}
