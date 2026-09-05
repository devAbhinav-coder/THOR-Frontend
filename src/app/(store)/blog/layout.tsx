import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const appUrl = getSiteUrl();
const OG_IMAGE = `${appUrl}/ogimage.png`;

export const metadata: Metadata = {
  title: "Saree Styling & Ethnic Wear Journal",
  description:
    "Saree & salwar styling, corset pairings, bridal ideas, fabric care, and festive tips from The House of Rani Journal.",
  keywords: [
    "saree styling tips",
    "bridal saree inspiration",
    "salwar suit styling",
    "corset styling tips",
    "Indian ethnic wear blog",
    "The House of Rani journal",
    "saree fashion India",
    "Indian bridal blog",
    "ethnic wear trends",
    "saree draping guide",
    "festive wear ideas",
    "hand painted saree styling",
  ],
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": `${appUrl}/api/feed/blog`,
    },
  },
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
    title: "The House of Rani Journal | Saree & Bridal Stories",
    description:
      "Saree styling tips, bridal outfit inspiration, and stories from The House of Rani atelier.",
    url: `${appUrl}/blog`,
    type: "website",
    siteName: "The House of Rani",
    locale: "en_IN",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The House of Rani Journal — Saree Styling Stories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The House of Rani Journal | Saree Styling Stories",
    description:
      "Saree styling, bridal inspiration, and stories from our atelier.",
    images: [OG_IMAGE],
  },
};

/** Listing layout — JSON-LD lives on blog/page.tsx to avoid duplicate schema on article URLs. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
