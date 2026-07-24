import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  SEO_CRAWL_ALLOW_PUBLIC,
  SEO_CRAWL_DISALLOW,
} from "@/lib/seoCrawl";

const DISALLOW = [...SEO_CRAWL_DISALLOW];
const ALLOW_PUBLIC = [...SEO_CRAWL_ALLOW_PUBLIC];

/** Answer-engine crawlers we allow to index public storefront pages (AEO/GEO). */
const AI_ANSWER_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Applebot-Extended",
] as const;

export default function robots(): MetadataRoute.Robots {
  const appUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOW_PUBLIC,
        disallow: DISALLOW,
      },
      {
        userAgent: ["Googlebot", "Googlebot-News", "Googlebot-Image"],
        allow: [...ALLOW_PUBLIC, "/api/feed"],
        disallow: DISALLOW,
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/shop",
          "/shop/collections",
          "/shop/collections/sarees",
          "/shop/collections/salwar-suits",
          "/shop/collections/corsets",
          "/about",
          "/blog",
          "/gifting",
          "/gifting/handmade-gifts",
          "/gifting/corporate-gifts",
        ],
        disallow: ["/admin/", "/auth/", "/dashboard/", "/cart/", "/checkout/"],
      },
      {
        userAgent: [...AI_ANSWER_BOTS],
        allow: ALLOW_PUBLIC,
        disallow: DISALLOW,
      },
      {
        /** Training crawlers — keep blocked unless you opt in to model training. */
        userAgent: ["CCBot", "Google-Extended"],
        disallow: "/",
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
