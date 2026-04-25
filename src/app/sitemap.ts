import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

type ProductLite = {
  slug?: string;
  updatedAt?: string;
  name?: string;
  images?: { url?: string; alt?: string }[];
};

type BlogLite = {
  slug?: string;
  updatedAt?: string;
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getSiteUrl();
  const apiUrl = await getBuildSafeApiBase();
  const now = new Date();

  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: `${appUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${appUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${appUrl}/gifting`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${appUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${appUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${appUrl}/shipping`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${appUrl}/returns`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: `${appUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  if (!apiUrl) return baseRoutes;

  try {
    const [productRes, blogRes, giftingRes] = await Promise.all([
      fetch(`${apiUrl}/products?limit=2000&page=1`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiUrl}/blogs?limit=2000&page=1`, {
        next: { revalidate: 3600 },
      }),
      // Fetch gifting catalogue separately — products that are gifting-only
      // may not appear in the general /products feed.
      fetch(`${apiUrl}/gifting/products?limit=2000&page=1`, {
        next: { revalidate: 3600 },
      }),
    ]);

    const productJson = productRes.ok ? await productRes.json() : null;
    const blogJson = blogRes.ok ? await blogRes.json() : null;
    const giftingJson = giftingRes.ok ? await giftingRes.json() : null;

    const products: ProductLite[] = productJson?.data?.products || [];
    const blogs: BlogLite[] = blogJson?.data?.blogs || [];
    const giftingProducts: GiftingProductLite[] =
      giftingJson?.data?.products || [];

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
      return [
        {
          url: `${appUrl}/blog/${encodeURIComponent(b.slug)}`,
          lastModified: b.updatedAt ? new Date(b.updatedAt) : undefined,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
      ];
    });

    return [...baseRoutes, ...productUrls, ...giftingProductUrls, ...blogUrls];
  } catch {
    return baseRoutes;
  }
}
