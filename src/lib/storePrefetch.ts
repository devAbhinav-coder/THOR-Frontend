import type { Category, Product } from "@/types";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

/** Categories with counts for home “Browse by Category” — avoids a client-only skeleton flash. */
export async function fetchHomeCategoryStats(): Promise<
  (Category & { productCount: number })[] | null
> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/categories/stats`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { categories?: (Category & { productCount: number })[] };
    };
    const list = json?.data?.categories;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

/** Featured products for home — same as `productApi.getFeatured()`. */
export async function fetchHomeFeaturedProducts(): Promise<Product[] | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/products/featured`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { products?: Product[] } };
    const list = json?.data?.products;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

/** Single product for PDP — matches `productApi.getBySlug` payload. */
export async function fetchProductBySlugServer(
  slug: string,
): Promise<Product | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  const safe = encodeURIComponent(slug);
  try {
    const res = await fetch(`${base}/products/${safe}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { product?: Product } };
    const p = json?.data?.product;
    return p && typeof p === "object" ? p : null;
  } catch {
    return null;
  }
}

type GiftingCategoriesEnvelope = {
  status: string;
  data?: { categories?: Category[] };
};

type GiftingProductsEnvelope = {
  status: string;
  data?: {
    products?: Product[];
    page?: number;
    limit?: number;
    total?: number;
  };
};

export async function fetchGiftingCategoriesServer(): Promise<GiftingCategoriesEnvelope | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/gifting/categories`, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as GiftingCategoriesEnvelope;
  } catch {
    return null;
  }
}

/** First page of gifting grid (default filters) — hydrates infinite query. */
export async function fetchGiftingProductsFirstPageServer(): Promise<GiftingProductsEnvelope | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const qs = new URLSearchParams({ page: "1", limit: "20" });
    const res = await fetch(`${base}/gifting/products?${qs}`, {
      next: { revalidate: 45 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as GiftingProductsEnvelope;
  } catch {
    return null;
  }
}
