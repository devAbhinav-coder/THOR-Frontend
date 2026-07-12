import { getBuildSafeApiBase } from "@/lib/buildApiBase";

type FeedProduct = {
  _id: string;
  slug?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  seoDescription?: string;
  price?: number;
  comparePrice?: number;
  category?: string;
  fabric?: string;
  images?: { url?: string }[];
  variants?: Array<{
    _id?: string;
    sku?: string;
    price?: number;
    comparePrice?: number;
    stock?: number;
    color?: string;
    size?: string;
  }>;
};

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

async function fetchPaginatedProducts(basePath: string): Promise<FeedProduct[]> {
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) return [];

  const all: FeedProduct[] = [];
  const seenSlugs = new Set<string>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const res = await fetch(
      `${apiUrl}${basePath}?limit=${PAGE_SIZE}&page=${page}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) break;

    const json = (await res.json()) as {
      data?: { products?: FeedProduct[] };
      pagination?: { totalPages?: number; hasNextPage?: boolean };
    };
    const chunk = json?.data?.products;
    if (Array.isArray(chunk)) {
      for (const product of chunk) {
        const slug = String(product?.slug || "").trim();
        if (slug && seenSlugs.has(slug)) continue;
        if (slug) seenSlugs.add(slug);
        all.push(product);
      }
    }

    totalPages = Math.max(1, Number(json?.pagination?.totalPages || 1));
    const hasNext = json?.pagination?.hasNextPage ?? page < totalPages;
    if (!hasNext) break;
    page += 1;
  }

  return all;
}

/** All catalog + gifting-only products for Google Merchant / Meta feeds. */
export async function fetchAllMerchantFeedProducts(): Promise<FeedProduct[]> {
  const [catalog, gifting] = await Promise.all([
    fetchPaginatedProducts("/products"),
    fetchPaginatedProducts("/gifting/products"),
  ]);

  const bySlug = new Map<string, FeedProduct>();
  for (const product of [...catalog, ...gifting]) {
    const slug = String(product?.slug || "").trim();
    if (!slug) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, product);
  }
  return Array.from(bySlug.values());
}
