import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

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
        disallow: ["/admin/*", "/auth/*", "/checkout/*", "/dashboard/*", "/api/*"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
