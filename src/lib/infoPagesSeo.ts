import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

type InfoPageConfig = {
  path: string;
  title: string;
  description: string;
  /** Slightly higher for FAQ/blog-adjacent pages Google should crawl sooner */
  priority?: "support" | "policy";
};

export function buildInfoPageMetadata({
  path,
  title,
  description,
  priority = "policy",
}: InfoPageConfig): Metadata {
  const appUrl = getSiteUrl();
  const canonical = path.startsWith("/") ? path : `/${path}`;
  const fullTitle =
    priority === "support" ? `${title} | The House of Rani` : `${title} | The House of Rani`;
  const ogImage = `${appUrl}/ogimage.png`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: `${appUrl}${canonical}`,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} — The House of Rani`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
