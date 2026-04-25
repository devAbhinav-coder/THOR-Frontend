import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const appUrl = getSiteUrl();

const OG_IMAGE = `${appUrl}/ogimage.png`;

export const metadata: Metadata = {
  title: "Gifting Collection | Curated Premium Gifts",
  description:
    "Explore thoughtful gifting at The House of Rani — premium, customizable gifts for weddings, corporate occasions, festivals, and personal celebrations. Shop curated gift collections with free shipping across India.",
  keywords: [
    "gifting collection India",
    "premium gift sets",
    "corporate gifting India",
    "wedding gifting",
    "festive gifts",
    "customizable gifts",
    "gift hampers India",
    "saree gift sets",
    "The House of Rani gifts",
    "personalized gifting",
    "occasion gifts",
    "ethnic gifting",
  ],
  alternates: {
    canonical: "/gifting",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
  },
  openGraph: {
    title: "Gifting Collection | The House of Rani",
    description:
      "Premium gifting made effortless — curated and customizable options for weddings, celebrations, and corporate occasions.",
    url: `${appUrl}/gifting`,
    type: "website",
    siteName: "The House of Rani",
    locale: "en_IN",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The House of Rani — Premium Gifting Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gifting Collection | The House of Rani",
    description:
      "Curated and customizable gifting for weddings, celebrations, and corporate occasions.",
    images: [OG_IMAGE],
  },
};

export default function GiftingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        name: "Gifting",
        item: `${appUrl}/gifting`,
      },
    ],
  };

  /**
   * GiftingService schema tells Google this is a specialised gifting
   * service page — helps appear in Shopping tab and gift-related queries.
   */
  const giftingServiceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${appUrl}/gifting#service`,
    name: "Gifting Collection — The House of Rani",
    url: `${appUrl}/gifting`,
    description:
      "Premium curated and customizable gifting for weddings, festivals, corporate occasions, and personal celebrations. Free shipping across India.",
    provider: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "The House of Rani",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    serviceType: "Gifting & Personalized Presents",
    /**
     * hasOfferCatalog — tells Google this service page has shoppable products.
     * Combined with the BreadcrumbList + Service schema, this makes the page
     * eligible for Google's "Gifting" and "Gifts" rich result types.
     */
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Premium Gift Collections",
      url: `${appUrl}/gifting`,
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Wedding Gifts",
          url: `${appUrl}/gifting?occasion=Wedding`,
        },
        {
          "@type": "OfferCatalog",
          name: "Corporate Gifts",
          url: `${appUrl}/gifting?occasion=Corporate`,
        },
        {
          "@type": "OfferCatalog",
          name: "Festival Gifts",
          url: `${appUrl}/gifting?occasion=Festival`,
        },
        {
          "@type": "OfferCatalog",
          name: "Birthday Gifts",
          url: `${appUrl}/gifting?occasion=Birthday`,
        },
      ],
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(giftingServiceLd) }}
      />
      {children}
    </>
  );
}
