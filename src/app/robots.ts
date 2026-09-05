import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  SEO_CRAWL_ALLOW_PUBLIC,
  SEO_CRAWL_DISALLOW,
  SEO_CRAWL_ALLOW_IMAGES,
  SEO_AI_ANSWER_BOTS,
} from "@/lib/seoCrawl";

const DISALLOW = [...SEO_CRAWL_DISALLOW];
const ALLOW_PUBLIC = [...SEO_CRAWL_ALLOW_PUBLIC];
const ALLOW_IMAGES = [...SEO_CRAWL_ALLOW_IMAGES];
const AI_ANSWER_BOTS = [...SEO_AI_ANSWER_BOTS];

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
        userAgent: ["Googlebot", "Googlebot-News"],
        allow: [...ALLOW_PUBLIC, "/api/feed", "/api/feed/blog", "/llms.txt", "/ai.txt"],
        disallow: DISALLOW,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ALLOW_IMAGES,
        disallow: ["/admin/", "/auth/", "/dashboard/", "/cart/", "/checkout/", "/wishlist/"],
      },
      {
        /** Answer engines / AEO — allow public storefront + AI discovery files. */
        userAgent: AI_ANSWER_BOTS,
        allow: [...ALLOW_PUBLIC, "/llms.txt", "/ai.txt", "/sitemap.xml"],
        disallow: DISALLOW,
      },
      {
        /** Training crawlers — blocked unless you opt in to model training. */
        userAgent: ["CCBot", "Google-Extended", "Bytespider", "FacebookBot"],
        disallow: "/",
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
