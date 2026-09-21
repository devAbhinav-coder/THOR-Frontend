import { cache } from "react";
import type { Blog, Category, Product } from "@/types";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { serverFetch } from "@/lib/serverFetch";

/** Categories with counts for home “Browse by Category” - avoids a client-only skeleton flash. */
export async function fetchHomeCategoryStats(): Promise<
  (Category & { productCount: number })[] | null
> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await serverFetch(`${base}/categories/stats`, {
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

/** Saree subcategories for home page section. */
export async function fetchHomeSareeSubcategories(): Promise<
  Category[] | null
> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await serverFetch(
      `${base}/categories/slug/sarees/subcategories`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { subcategories?: Category[] };
    };
    const list = json?.data?.subcategories;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

/** Latest published blogs for home Heritage Stories - hides section when empty. */
export async function fetchHomeLatestBlogs(limit = 3): Promise<Blog[] | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await serverFetch(
      `${base}/blogs?limit=${limit}&page=1&sort=-createdAt`,
      {
        next: { revalidate: 300 },
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { blogs?: Blog[] } };
    const list = json?.data?.blogs;
    return Array.isArray(list) ?
        list.filter((b) => b?.slug && b?.title && b.isPublished !== false)
      : null;
  } catch {
    return null;
  }
}

/** Featured products for home - same as `productApi.getFeatured()`. */
export async function fetchHomeFeaturedProducts(): Promise<Product[] | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await serverFetch(`${base}/products/featured`, {
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

/** Public testimonials for home - same as `testimonialApi.getPublic()`. */
export async function fetchHomeTestimonials(): Promise<
  import("@/types").Testimonial[] | null
> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await serverFetch(`${base}/testimonials`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { testimonials?: import("@/types").Testimonial[] };
    };
    const list = json?.data?.testimonials;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

/** First explore page for home infinite scroll seed. */
export async function fetchHomeExploreProducts(
  limit = 12,
): Promise<Product[] | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await serverFetch(
      `${base}/products?limit=${limit}&isRandom=true`,
      {
        next: { revalidate: 120 },
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { products?: Product[] } };
    const list = json?.data?.products;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

/** Single product for PDP - deduped per request (metadata + page + JSON-LD). */
export const fetchProductBySlugServer = cache(
  async (slug: string): Promise<Product | null> => {
    const base = await getBuildSafeApiBase();
    if (!base) return null;
    const safe = encodeURIComponent(slug);
    try {
      const res = await serverFetch(`${base}/products/${safe}`, {
        next: { revalidate: 60 },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: { product?: Product } };
      const p = json?.data?.product;
      return p && typeof p === "object" ? p : null;
    } catch {
      return null;
    }
  },
);

type PremiumProductsEnvelope = {
  status: string;
  data?: { products?: Product[] };
};

/** Premium collection grid - all active premium products. */
export async function fetchPremiumProductsServer(
  audience?: string,
): Promise<Product[] | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const qs = new URLSearchParams({ page: "1", limit: "48" });
    if (audience) {
      qs.set("audience", audience);
    }
    const res = await serverFetch(`${base}/premium/products?${qs}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PremiumProductsEnvelope;
    const list = json?.data?.products;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

/** Single premium PDP payload - deduped per request (metadata + page). */
export const fetchPremiumProductBySlugServer = cache(
  async (slug: string): Promise<Product | null> => {
    const base = await getBuildSafeApiBase();
    if (!base) return null;
    const safe = encodeURIComponent(slug);
    try {
      const res = await serverFetch(`${base}/premium/products/${safe}`, {
        next: { revalidate: 60 },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: { product?: Product } };
      const p = json?.data?.product;
      return p && typeof p === "object" ? p : null;
    } catch {
      return null;
    }
  },
);
