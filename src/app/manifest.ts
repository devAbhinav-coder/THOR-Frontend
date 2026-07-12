import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = getSiteUrl();

  return {
    name: "The House of Rani — Premium Sarees & Ethnic Wear",
    short_name: "House of Rani",
    description:
      "Shop premium sarees, salwar suits, lehengas, and ethnic gift sets online in India.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c2942",
    lang: "en-IN",
    scope: "/",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    id: `${siteUrl}/`,
  };
}
