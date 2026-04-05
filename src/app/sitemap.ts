import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

type ProductLite = {
  slug?: string;
  updatedAt?: string;
};

type BlogLite = {
  slug?: string;
  updatedAt?: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getSiteUrl();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const now = new Date();

  const baseRoutes: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${appUrl}/gifting`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${appUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${appUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  if (!apiUrl) return baseRoutes;

  try {
    const [productRes, blogRes] = await Promise.all([
      fetch(`${apiUrl}/products?limit=2000&page=1`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiUrl}/blogs?limit=2000&page=1`, {
        next: { revalidate: 3600 },
      }),
    ]);

    const productJson = productRes.ok ? await productRes.json() : null;
    const blogJson = blogRes.ok ? await blogRes.json() : null;

    const products: ProductLite[] = productJson?.data?.products || [];
    const blogs: BlogLite[] = blogJson?.data?.blogs || [];

    const productUrls: MetadataRoute.Sitemap = products.flatMap((p) => {
      if (!p?.slug) return [];
      return [{
        url: `${appUrl}/shop/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }];
    });

    const blogUrls: MetadataRoute.Sitemap = blogs.flatMap((b) => {
      if (!b?.slug) return [];
      return [{
        url: `${appUrl}/blog/${encodeURIComponent(b.slug)}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }];
    });

    return [...baseRoutes, ...productUrls, ...blogUrls];
  } catch {
    return baseRoutes;
  }
}
