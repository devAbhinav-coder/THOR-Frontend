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
import type { MegaMenuCategory } from "@/types";

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

/** Prefer the first (usually higher-priority) entry when URLs collide. */
function dedupeSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    const key = String(entry.url || "").replace(/\/$/, "") || entry.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
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
    const [products, blogs, giftingProducts, megaMenuRes] = await Promise.all([
      fetchAllSitemapProducts(),
      fetchAllSitemapBlogs(),
      fetchAllSitemapGiftingProducts(),
      fetch(`${apiUrl}/navigation/mega-menu`, {
        next: { revalidate: 3600 },
      }),
    ]);

    const megaMenuJson = megaMenuRes.ok ? await megaMenuRes.json() : null;
    const categories: MegaMenuCategory[] = megaMenuJson?.data?.categories || [];

    // Track product slugs already emitted to avoid apparel/gifting PDP duplicates.
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

    // Gifting-only PDPs that are not already in the main catalog.
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
      .filter((c) => Boolean(c?.name) && isShopCatalogCategoryLite(c))
      .flatMap((c) => {
        const slugSource = c.slug ?? c.name ?? "";
        const slug = toShopCategorySlug(slugSource);
        if (!slug || emittedCategorySlugs.has(slug)) return [];
        emittedCategorySlugs.add(slug);

        const catRoute = {
          url: `${appUrl}/shop/collections/${encodeURIComponent(slug)}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.82,
        };

        const emittedSubSlugs = new Set<string>();
        const subRoutes = (c.subcategories || []).flatMap((sub) => {
          const subSlug = String(sub?.slug || "").trim();
          if (!subSlug || emittedSubSlugs.has(subSlug)) return [];
          emittedSubSlugs.add(subSlug);
          return [
            {
              url: `${appUrl}/shop/collections/${encodeURIComponent(slug)}/${encodeURIComponent(subSlug)}`,
              lastModified: now,
              changeFrequency: "daily" as const,
              priority: 0.8,
            },
          ];
        });

        return [catRoute, ...subRoutes];
      });

    return dedupeSitemap([
      ...baseRoutes,
      ...categoryUrls,
      ...productUrls,
      ...giftingProductUrls,
      ...blogUrls,
    ]);
  } catch {
    return baseRoutes;
  }
}
