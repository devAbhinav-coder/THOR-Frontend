import type { MetadataRoute } from "next";
import { parseAuthModalView } from "@/lib/authModal";

/**
 * Paths that must not be indexed.
 * Auth uses an on-page modal (`?auth=login`); legacy `/auth/*` routes redirect
 * and stay blocked here. Middleware adds `X-Robots-Tag: noindex` for `?auth=`.
 */
export const SEO_CRAWL_DISALLOW = [
  "/admin",
  "/admin/",
  "/auth",
  "/auth/",
  "/checkout",
  "/checkout/",
  "/cart",
  "/cart/",
  "/dashboard",
  "/dashboard/",
  "/api/",
] as const;

/** Public storefront pages — sitemap + explicit robots Allow (includes /about). */
export const SEO_SITEMAP_STATIC: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.95 },
  { path: "/gifting", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.84 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.78 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.72 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.65 },
  { path: "/returns", changeFrequency: "monthly", priority: 0.65 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.55 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.55 },
];

/** Highlighted in robots.txt so crawlers clearly index trust & brand pages. */
export const SEO_CRAWL_ALLOW_PUBLIC = [
  "/",
  "/shop",
  "/gifting",
  "/about",
  "/blog",
  "/faq",
  "/shipping",
  "/returns",
  "/terms",
  "/privacy",
] as const;

export function isAuthModalSearchParam(
  value: string | null | undefined,
): boolean {
  return parseAuthModalView(value) !== null;
}
