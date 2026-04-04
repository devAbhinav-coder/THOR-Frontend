import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.thehouseofrani.com").replace(/\/+$/, "");

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
