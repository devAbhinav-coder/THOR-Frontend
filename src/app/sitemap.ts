import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";
import {
  fetchAllSitemapBlogs,
  fetchAllSitemapGiftingProducts,
  fetchAllSitemapProducts,
} from "@/lib/sitemapData";
import { SEO_SITEMAP_STATIC } from "@/lib/seoCrawl";

type ProductLite = {
  slug?: string;
  updatedAt?: string;
  name?: string;
  images?: { url?: string; alt?: string }[];
};

type BlogLite = {
  slug?: string;
  updatedAt?: string;
  viewCount?: number;
};

/**
 * Gifting products live on the same /shop/[slug] URL as regular products
 * (same Product model, same PDP).  We fetch them separately so products
 * that are ONLY in the gifting catalogue still get included in the sitemap.
 * A slug-based Set is used to deduplicate before emitting URLs.
 */
type GiftingProductLite = {
  slug?: string;
  updatedAt?: string;
  images?: { url?: string }[];
};

type CategoryLite = {
  name?: string;
  slug?: string;
  isGiftCategory?: boolean;
};

function isShopCatalogCategoryLite(c: CategoryLite): boolean {
  if (c.isGiftCategory) return false;
  const name = String(c.name || "").toLowerCase();
  const slug = String(c.slug || "").toLowerCase();
  return !(
    name.includes("gift") ||
    name.includes("gifting") ||
    slug.includes("gift")
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getSiteUrl();
  const apiUrl = await getBuildSafeApiBase();
  const now = new Date();

  const baseRoutes: MetadataRoute.Sitemap = SEO_SITEMAP_STATIC.map((route) => ({
    url: `${appUrl}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  if (!apiUrl) return baseRoutes;

  try {
    const [products, blogs, giftingProducts, categoryRes] = await Promise.all([
      fetchAllSitemapProducts(),
      fetchAllSitemapBlogs(),
      fetchAllSitemapGiftingProducts(),
      fetch(`${apiUrl}/categories?active=true`, {
        next: { revalidate: 3600 },
      }),
    ]);

    const categoryJson = categoryRes.ok ? await categoryRes.json() : null;
    const categories: CategoryLite[] = categoryJson?.data?.categories || [];

    // Track slugs already emitted to avoid duplicates
    const emittedSlugs = new Set<string>();

    const productUrls: MetadataRoute.Sitemap = products.flatMap((p) => {
      if (!p?.slug) return [];
      emittedSlugs.add(p.slug);
      const productImages = (p.images || [])
        .filter((img) => img?.url)
        .slice(0, 5)
        .map((img) => img.url as string);

      return [
        {
          url: `${appUrl}/shop/${encodeURIComponent(p.slug)}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
          changeFrequency: "daily" as const,
          priority: 0.89,
          ...(productImages.length > 0 ? { images: productImages } : {}),
        },
      ];
    });

    // Only include gifting products whose slug hasn't been emitted yet.
    // This handles gifting-only products that don't appear in /products.
    const giftingProductUrls: MetadataRoute.Sitemap = giftingProducts.flatMap(
      (p) => {
        if (!p?.slug || emittedSlugs.has(p.slug)) return [];
        emittedSlugs.add(p.slug);
        const giftImages = (p.images || [])
          .filter((img) => img?.url)
          .slice(0, 5)
          .map((img) => img.url as string);

        return [
          {
            url: `${appUrl}/shop/${encodeURIComponent(p.slug)}`,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
            changeFrequency: "daily" as const,
            priority: 0.85,
            ...(giftImages.length > 0 ? { images: giftImages } : {}),
          },
        ];
      },
    );

    const blogUrls: MetadataRoute.Sitemap = blogs.flatMap((b) => {
      if (!b?.slug) return [];
      const views = b.viewCount ?? 0;
      const priority =
        views >= 500 ? 0.82
        : views >= 200 ? 0.78
        : views >= 50 ? 0.74
        : 0.7;
      return [
        {
          url: `${appUrl}/blog/${encodeURIComponent(b.slug)}`,
          lastModified: b.updatedAt ? new Date(b.updatedAt) : undefined,
          changeFrequency: "weekly" as const,
          priority,
        },
      ];
    });

    const emittedCategorySlugs = new Set<string>();
    const categoryUrls: MetadataRoute.Sitemap = categories
      .filter((c): c is CategoryLite => Boolean(c?.name))
      .filter((c) => isShopCatalogCategoryLite(c))
      .flatMap((c) => {
        const slugSource = c.slug ?? c.name ?? "";
        const slug = toShopCategorySlug(slugSource);
        if (!slug || emittedCategorySlugs.has(slug)) return [];
        emittedCategorySlugs.add(slug);
        return [
          {
            url: `${appUrl}/shop/category/${encodeURIComponent(slug)}`,
            lastModified: now,
            changeFrequency: "daily" as const,
            priority: 0.82,
          },
        ];
      });

    return [
      ...baseRoutes,
      ...categoryUrls,
      ...productUrls,
      ...giftingProductUrls,
      ...blogUrls,
    ];
  } catch {
    return baseRoutes;
  }
}
