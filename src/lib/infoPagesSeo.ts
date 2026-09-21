import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

type InfoPageConfig = {
  path: string;
  title: string;
  description: string;
  /** Slightly higher for FAQ/blog-adjacent pages Google should crawl sooner */
  priority?: "support" | "policy";
  /** Override default /ogimage.png when a page has a stronger hero visual */
  ogImage?: string;
  ogImageAlt?: string;
};

export function buildInfoPageMetadata({
  path,
  title,
  description,
  priority = "policy",
  ogImage: ogImageOverride,
  ogImageAlt,
}: InfoPageConfig): Metadata {
  const appUrl = getSiteUrl();
  const canonical = path.startsWith("/") ? path : `/${path}`;
  void priority;
  const ogImage = ogImageOverride?.startsWith("http")
    ? ogImageOverride
    : ogImageOverride
      ? `${appUrl}${ogImageOverride.startsWith("/") ? ogImageOverride : `/${ogImageOverride}`}`
      : `${appUrl}/ogimage.png`;
  const ogAlt = ogImageAlt ?? `${title} - The House of Rani`;

  return {
    title,
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
      title: `${title} | The House of Rani`,
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
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | The House of Rani`,
      description,
      images: [ogImage],
    },
  };
}
