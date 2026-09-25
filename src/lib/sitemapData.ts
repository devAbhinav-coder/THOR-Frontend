import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import {
  CATALOG_PRODUCTS_CACHE_TAG,
  MEGA_MENU_CACHE_TAG,
  PREMIUM_CATALOG_CACHE_TAG,
  SITEMAP_CACHE_TAG,
} from "@/lib/cacheTags";
import { serverFetch } from "@/lib/serverFetch";
import type { MegaMenuCategory } from "@/types";

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
  extraTags: string[] = [],
): Promise<T[]> {
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) return [];

  const all: T[] = [];
  let page = 1;
  let totalPages = 1;
  const tags = [
    SITEMAP_CACHE_TAG,
    CATALOG_PRODUCTS_CACHE_TAG,
    ...extraTags,
  ];

  while (page <= totalPages && page <= MAX_PAGES) {
    const res = await fetch(`${apiUrl}${basePath}?limit=${PAGE_SIZE}&page=${page}`, {
      next: {
        revalidate: 3600,
        tags,
      },
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
  return fetchPaginatedList<{
    slug?: string;
    updatedAt?: string;
    viewCount?: number;
    images?: { url?: string }[];
  }>("/blogs", "blogs");
}

export function fetchAllSitemapPremiumProducts() {
  return fetchPaginatedList<{
    slug?: string;
    premiumSlug?: string;
    updatedAt?: string;
    images?: { url?: string }[];
    premiumHeroImage?: { url?: string };
  }>("/premium/products", "products", [PREMIUM_CATALOG_CACHE_TAG]);
}

const sitemapFetchTags = [SITEMAP_CACHE_TAG, CATALOG_PRODUCTS_CACHE_TAG] as const;

/** Categories + subcategories for sitemap (same source as storefront nav). */
export async function fetchSitemapMegaMenuCategories(): Promise<
  MegaMenuCategory[]
> {
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) return [];

  try {
    const res = await serverFetch(`${apiUrl}/navigation/mega-menu`, {
      next: {
        revalidate: 3600,
        tags: [...sitemapFetchTags, MEGA_MENU_CACHE_TAG],
      },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { categories?: MegaMenuCategory[] };
    };
    return Array.isArray(json?.data?.categories) ?
        json.data.categories
      : [];
  } catch {
    return [];
  }
}
