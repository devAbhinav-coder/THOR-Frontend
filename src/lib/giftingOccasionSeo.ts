import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export type GiftingOccasionKey = "corporate" | "wedding" | "festival" | "birthday";

type OccasionSeoPreset = {
  path: string;
  /** Value passed to GiftingPageClient pinnedOccasion */
  occasionFilter: string;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
};

const OCCASION_PRESETS: Record<GiftingOccasionKey, OccasionSeoPreset> = {
  corporate: {
    path: "/gifting/corporate-gifts",
    occasionFilter: "Corporate",
    title: "Corporate Gift Sets & Ethnic Hampers for Business India",
    description:
      "Shop corporate gift sets, saree hampers, and premium ethnic gifting for employees, clients, and partners. Bulk orders, pan-India delivery, and 5-day returns at The House of Rani.",
    h1: "Corporate Gift Sets & Ethnic Hampers Online India",
    keywords: [
      "corporate gifts India",
      "corporate gifting online",
      "business gift hampers",
      "employee gift sets",
      "client gifting India",
      "corporate saree gifts",
      "ethnic corporate hampers",
      "bulk corporate gifts",
      "The House of Rani corporate gifting",
    ],
  },
  wedding: {
    path: "/gifting/wedding-gifts",
    occasionFilter: "Wedding",
    title: "Wedding Gift Sets & Bridal Saree Hampers Online India",
    description:
      "Curated wedding gift sets, bridal saree hampers, and celebration presents for couples and families. Premium packaging with free delivery over ₹1,099.",
    h1: "Wedding Gift Sets & Bridal Hampers Online India",
    keywords: [
      "wedding gift sets India",
      "bridal saree gifts",
      "wedding hampers online",
      "marriage gift ideas India",
      "wedding gifting collection",
      "ethnic wedding gifts",
    ],
  },
  festival: {
    path: "/gifting/festival-gifts",
    occasionFilter: "Festival",
    title: "Festival Gift Sets & Ethnic Hampers Online India",
    description:
      "Festive gift sets and ethnic hampers for Diwali, Rakhi, and celebrations. Thoughtful saree gifts with pan-India shipping from The House of Rani.",
    h1: "Festival Gift Sets & Ethnic Hampers Online India",
    keywords: [
      "festival gifts India",
      "Diwali gift hampers",
      "festive saree gifts",
      "ethnic festival hampers",
      "Rakhi gift sets",
    ],
  },
  birthday: {
    path: "/gifting/birthday-gifts",
    occasionFilter: "Birthday",
    title: "Birthday Gift Sets & Personalized Ethnic Gifts India",
    description:
      "Birthday gift sets, saree presents, and customizable ethnic gifts for her. Fast dispatch and easy returns across India.",
    h1: "Birthday Gift Sets & Ethnic Presents Online India",
    keywords: [
      "birthday gifts for her India",
      "saree birthday gifts",
      "ethnic birthday hampers",
      "personalized birthday gifts",
    ],
  },
};

export function getGiftingOccasionPreset(key: GiftingOccasionKey): OccasionSeoPreset {
  return OCCASION_PRESETS[key];
}

export function buildGiftingOccasionMetadata(key: GiftingOccasionKey): Metadata {
  const preset = OCCASION_PRESETS[key];
  const appUrl = getSiteUrl();
  const ogImage = `${appUrl}/ogimage.png`;

  return {
    title: preset.title,
    description: preset.description,
    keywords: preset.keywords,
    alternates: { canonical: preset.path },
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
      title: `${preset.title} | The House of Rani`,
      description: preset.description,
      url: `${appUrl}${preset.path}`,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: preset.h1,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${preset.title} | The House of Rani`,
      description: preset.description,
      images: [ogImage],
    },
  };
}

export function buildGiftingOccasionJsonLd(key: GiftingOccasionKey) {
  const preset = OCCASION_PRESETS[key];
  const appUrl = getSiteUrl();
  const pageUrl = `${appUrl}${preset.path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${appUrl}/` },
          { "@type": "ListItem", position: 2, name: "Gifting", item: `${appUrl}/gifting` },
          { "@type": "ListItem", position: 3, name: preset.h1, item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collectionpage`,
        name: preset.h1,
        description: preset.description,
        url: pageUrl,
        inLanguage: "en-IN",
        isPartOf: { "@id": `${appUrl}/#website` },
        about: {
          "@type": "Thing",
          name: preset.occasionFilter,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Does The House of Rani offer ${preset.occasionFilter.toLowerCase()} gifting across India?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. The House of Rani ships ${preset.occasionFilter.toLowerCase()} gift sets and ethnic hampers pan-India with free delivery on orders over ₹1,099 and a 5-day return policy.`,
            },
          },
          {
            "@type": "Question",
            name: "What types of ethnic gifts are available?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Choose from saree gift sets, salwar suit hampers, curated ethnic wear collections, and customizable presents for weddings, festivals, birthdays, and corporate occasions.",
            },
          },
        ],
      },
    ],
  };
}
