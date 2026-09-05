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
  "/wishlist",
  "/wishlist/",
  "/dashboard",
  "/dashboard/",
  "/gifting",
  "/gifting/",
  "/api/",
] as const;

/** Public storefront pages — sitemap + explicit robots Allow. */
export const SEO_SITEMAP_STATIC: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop/collections", changeFrequency: "daily", priority: 0.95 },
  { path: "/premium", changeFrequency: "daily", priority: 0.93 },
  { path: "/premium/women", changeFrequency: "daily", priority: 0.91 },
  { path: "/premium/couple", changeFrequency: "weekly", priority: 0.9 },
  { path: "/premium/men", changeFrequency: "weekly", priority: 0.88 },
  { path: "/premium/kids", changeFrequency: "weekly", priority: 0.86 },
  // Category/subcategory URLs come from mega-menu at sitemap generation time.
  { path: "/about", changeFrequency: "monthly", priority: 0.84 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.78 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.72 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.65 },
  { path: "/returns", changeFrequency: "monthly", priority: 0.65 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.55 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.55 },
];

/** Highlighted in robots.txt so crawlers clearly index trust, shop & Premium Edit. */
export const SEO_CRAWL_ALLOW_PUBLIC = [
  "/",
  "/shop",
  "/shop/collections",
  "/premium",
  "/premium/women",
  "/premium/men",
  "/premium/kids",
  "/premium/couple",
  "/about",
  "/blog",
  "/faq",
  "/shipping",
  "/returns",
  "/terms",
  "/privacy",
  "/llms.txt",
  "/ai.txt",
] as const;

/** Image SEO allow list (Googlebot-Image) — keep in sync with public storefront media. */
export const SEO_CRAWL_ALLOW_IMAGES = [
  "/",
  "/shop",
  "/shop/collections",
  "/premium",
  "/premium/women",
  "/premium/men",
  "/premium/kids",
  "/premium/couple",
  "/about",
  "/blog",
] as const;

/**
 * Answer-engine / AEO crawlers — allow public pages + llms.txt.
 * Training-only bots stay blocked in robots.ts.
 */
export const SEO_AI_ANSWER_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  "PerplexityBot",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
  "YouBot",
] as const;

export function isAuthModalSearchParam(
  value: string | null | undefined,
): boolean {
  return parseAuthModalView(value) !== null;
}
