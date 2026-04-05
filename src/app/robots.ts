import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getSiteUrl();

  return {
    rules: [
      {
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
        userAgent: ["Googlebot", "Googlebot-Image"],
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
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
