import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export type GiftingOccasionKey =
  | "handmade"
  | "corporate"
  | "wedding"
  | "festival"
  | "birthday";

type OccasionSeoPreset = {
  path: string;
  /** Value passed to GiftingPageClient pinnedOccasion (empty = all occasions). */
  occasionFilter: string;
  /** Optional pinned search for landings like handmade gifts. */
  searchFilter?: string;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
};

const OCCASION_PRESETS: Record<GiftingOccasionKey, OccasionSeoPreset> = {
  handmade: {
    path: "/gifting/handmade-gifts",
    occasionFilter: "",
    searchFilter: "handmade",
    title: "Handmade Gifts & Artisan Pen Gifts Online India",
    description:
      "Shop handmade gifts, artisan pen presents & curated sets at The House of Rani. Free delivery over ₹1,099 and 5-day returns.",
    h1: "Handmade Gifts & Artisan Presents Online India",
    keywords: [
      "handmade gifts India",
      "handmade pen gifts",
      "artisan handmade gifts",
      "personalized handmade gifts",
      "The House of Rani handmade",
    ],
  },
  corporate: {
    path: "/gifting/corporate-gifts",
    occasionFilter: "Corporate",
    title: "Corporate Gift Sets & Business Gifting Online India",
    description:
      "Corporate gift sets & handmade business presents for clients and teams. Bulk orders, pan-India delivery, 5-day returns.",
    h1: "Corporate Gift Sets & Business Gifting Online India",
    keywords: [
      "corporate gifts India",
      "corporate gifting online",
      "business gift hampers",
      "employee gift sets",
      "client gifting India",
      "handmade corporate gifts",
      "bulk corporate gifts",
      "The House of Rani corporate gifting",
    ],
  },
  wedding: {
    path: "/gifting/wedding-gifts",
    occasionFilter: "Wedding",
    title: "Wedding Gift Sets & Celebration Hampers Online India",
    description:
      "Wedding gift sets, handmade presents & celebration hampers for couples and families. Free delivery over ₹1,099.",
    h1: "Wedding Gift Sets & Celebration Hampers Online India",
    keywords: [
      "wedding gift sets India",
      "handmade wedding gifts",
      "wedding hampers online",
      "marriage gift ideas India",
      "wedding gifting collection",
      "ethnic wedding gifts",
    ],
  },
  festival: {
    path: "/gifting/festival-gifts",
    occasionFilter: "Festival",
    title: "Festival Gift Sets & Hampers Online India",
    description:
      "Festival gift sets & handmade hampers for Diwali, Rakhi, and celebrations. Pan-India shipping from The House of Rani.",
    h1: "Festival Gift Sets & Hampers Online India",
    keywords: [
      "festival gifts India",
      "Diwali gift hampers",
      "handmade festive gifts",
      "ethnic festival hampers",
      "Rakhi gift sets",
    ],
  },
  birthday: {
    path: "/gifting/birthday-gifts",
    occasionFilter: "Birthday",
    title: "Birthday Gift Sets & Personalized Gifts Online India",
    description:
      "Birthday gift sets, handmade pen gifts & customizable presents for her. Fast dispatch and easy returns across India.",
    h1: "Birthday Gift Sets & Personalized Presents Online India",
    keywords: [
      "birthday gifts for her India",
      "handmade birthday gifts",
      "handmade pen gifts",
      "personalized birthday gifts",
      "birthday gift hampers",
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

/** Collection + breadcrumb only — no FAQPage (no visible FAQ UI on these landings). */
export function buildGiftingOccasionJsonLd(key: GiftingOccasionKey) {
  const preset = OCCASION_PRESETS[key];
  const appUrl = getSiteUrl();
  const pageUrl = `${appUrl}${preset.path}`;
  const aboutName =
    preset.occasionFilter ||
    preset.searchFilter ||
    "Gifting";

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
          name: aboutName,
        },
      },
    ],
  };
}
