import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const appUrl = getSiteUrl();

const OG_IMAGE = `${appUrl}/ogimage.png`;

export const metadata: Metadata = {
  title: "Handmade Gifts, Corporate Gifting & Hampers Online India",
  description:
    "Buy handmade gifts, corporate gift sets & curated hampers online in India. Free shipping over ₹1,099 at The House of Rani.",
  keywords: [
    "gifting collection India",
    "handmade gifts India",
    "handmade pen gifts",
    "artisan handmade gifts",
    "corporate gifting India",
    "corporate gift sets",
    "gift hampers India",
    "wedding gifting",
    "festive gifts",
    "customizable gifts",
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
      "Handmade gifts, corporate gifting, and curated hampers — customizable options for every occasion.",
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
      "Handmade gifts, corporate gifting, and curated hampers for every celebration.",
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
      "Premium curated and customizable gifting — handmade artisan gifts, corporate sets, and hampers for weddings, festivals, and personal celebrations. Free shipping across India.",
    provider: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "The House of Rani",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    serviceType: "Handmade & Corporate Gifting",
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
          name: "Handmade Gifts",
          url: `${appUrl}/gifting/handmade-gifts`,
        },
        {
          "@type": "OfferCatalog",
          name: "Corporate Gifts",
          url: `${appUrl}/gifting/corporate-gifts`,
        },
        {
          "@type": "OfferCatalog",
          name: "Wedding Gifts",
          url: `${appUrl}/gifting/wedding-gifts`,
        },
        {
          "@type": "OfferCatalog",
          name: "Festival Gifts",
          url: `${appUrl}/gifting/festival-gifts`,
        },
        {
          "@type": "OfferCatalog",
          name: "Birthday Gifts",
          url: `${appUrl}/gifting/birthday-gifts`,
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
        merchantReturnDays: 5,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 10,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(giftingServiceLd) }}
      />
      {children}
    </>
  );
}
