import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getSiteUrl();

  return {
    rules: [
      {
        /* Primary crawlers — allow all public pages, block private ones */
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/auth",
          "/auth/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/cart/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*",
        ],
      },
      {
        /* Google — same as above but without auth root to avoid redirect loops */
        userAgent: ["Googlebot", "Googlebot-News"],
        allow: "/",
        disallow: [
          "/admin/*",
          "/auth/*",
          "/checkout/*",
          "/cart",
          "/cart/*",
          "/dashboard/*",
          "/api/*",
        ],
      },
      {
        /*
         * Googlebot-Image must be explicitly allowed to crawl Cloudinary URLs
         * so product images appear in Google Images and Google Shopping.
         * Without this rule, image crawling may fall back to the generic
         * "*" rule which is less trusted by Google.
         */
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/admin/*", "/auth/*", "/dashboard/*"],
      },
      {
        /*
         * Block AI training crawlers from scraping product descriptions,
         * pricing, and customer reviews.
         */
        userAgent: ["GPTBot", "CCBot", "anthropic-ai", "Claude-Web"],
        disallow: "/",
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
