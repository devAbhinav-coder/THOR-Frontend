import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const appUrl = getSiteUrl();
const OG_IMAGE = `${appUrl}/ogimage.png`;

export const metadata: Metadata = {
  title: "The House of Rani Journal | Saree Styling, Bridal & Gifting Stories",
  description:
    "Explore the House of Rani Journal — saree styling advice, bridal outfit inspiration, gifting ideas for every occasion, and behind-the-scenes stories from our atelier. Discover Indian ethnic wear through every story.",
  keywords: [
    "saree styling tips",
    "bridal saree inspiration",
    "Indian ethnic wear blog",
    "gifting ideas India",
    "The House of Rani journal",
    "saree fashion India",
    "lehenga styling tips",
    "Indian bridal blog",
    "ethnic wear trends",
    "saree draping guide",
    "corporate gifting blog",
    "festive wear ideas",
  ],
  alternates: {
    canonical: "/blog",
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
    title: "The House of Rani Journal | Saree, Bridal & Gifting Stories",
    description:
      "Saree styling tips, bridal outfit inspiration, gifting ideas, and stories from The House of Rani atelier.",
    url: `${appUrl}/blog`,
    type: "website",
    siteName: "The House of Rani",
    locale: "en_IN",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The House of Rani Journal — Saree Styling & Gifting Stories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The House of Rani Journal | Saree Styling & Gifting Stories",
    description:
      "Saree styling, bridal inspiration, gifting ideas, and stories from our atelier.",
    images: [OG_IMAGE],
  },
};

/**
 * Blog layout — renders JSON-LD for the Blog listing page.
 * Individual blog post JSON-LD (BlogPosting) is rendered in blog/[slug]/page.tsx
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const blogListingLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${appUrl}/blog#blog`,
    name: "The House of Rani Journal",
    description:
      "Saree styling tips, bridal inspiration, gifting ideas, and behind-the-scenes stories from The House of Rani.",
    url: `${appUrl}/blog`,
    publisher: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "The House of Rani",
      logo: {
        "@type": "ImageObject",
        url: `${appUrl}/logoNew.png`,
      },
    },
    inLanguage: "en-IN",
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${appUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Journal",
        item: `${appUrl}/blog`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
