import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  SEO_CRAWL_ALLOW_PUBLIC,
  SEO_CRAWL_DISALLOW,
} from "@/lib/seoCrawl";

const DISALLOW = [...SEO_CRAWL_DISALLOW];
const ALLOW_PUBLIC = [...SEO_CRAWL_ALLOW_PUBLIC];

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
        allow: ALLOW_PUBLIC,
        disallow: DISALLOW,
      },
      {
        /*
         * Googlebot-Image: product images on Cloudinary + on-site assets.
         */
        userAgent: "Googlebot-Image",
        allow: ["/", "/shop", "/about", "/blog", "/gifting"],
        disallow: ["/admin/", "/auth/", "/dashboard/", "/cart/", "/checkout/"],
      },
      {
        userAgent: [
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Google-Extended",
          "OAI-SearchBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
