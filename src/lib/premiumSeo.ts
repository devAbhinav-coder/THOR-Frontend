import type { Metadata } from "next";
import { buildInfoPageMetadata } from "@/lib/infoPagesSeo";
import {
  buildProductMetaDescription,
  buildProductPageTitle,
  resolveSerpTitleString,
} from "@/lib/pageSeo";
import { getSiteUrl } from "@/lib/siteUrl";
import type { PremiumProductView } from "@/lib/premiumProductMapper";

/** Core India-intent keywords for The Rani Premium Edit. */
export const PREMIUM_SEO_KEYWORDS = [
  "hand painted saree",
  "pure silk saree",
  "Banarasi saree",
  "Madhubani art saree",
  "couple hand painted saree set",
  "premium sarees India",
  "The House of Rani",
] as const;

export type PremiumAudienceSeoId =
  | "all"
  | "women"
  | "men"
  | "kids"
  | "couple";

type AudienceSeoCopy = {
  path: string;
  /** Segment for root title template (no brand suffix). */
  title: string;
  description: string;
  keywords: string;
};

const AUDIENCE_SEO: Record<PremiumAudienceSeoId, AudienceSeoCopy> = {
  all: {
    path: "/premium",
    title: "Hand Painted & Pure Silk Sarees — Premium Edit",
    description:
      "Shop hand painted sarees, pure silk sarees, Banarasi & Madhubani art sarees, and couple hand painted sets in The Rani Premium Edit. Heirloom weaves with pan-India delivery.",
    keywords: PREMIUM_SEO_KEYWORDS.join(", "),
  },
  women: {
    path: "/premium/women",
    title: "Women's Hand Painted & Pure Silk Sarees",
    description:
      "Discover women's premium hand painted sarees, pure silk and Banarasi drapes, and Madhubani art pieces in The Rani Edit. Free delivery over ₹1,099 across India.",
    keywords:
      "women's hand painted saree, pure silk saree women, Banarasi saree, Madhubani saree, premium sarees India, The House of Rani",
  },
  men: {
    path: "/premium/men",
    title: "Men's Premium Silk & Heritage Wear",
    description:
      "Explore men's premium silk and heritage pieces from The Rani Edit — refined Banarasi and handloom styles for weddings and celebrations across India.",
    keywords:
      "men's premium silk, Banarasi kurta, heritage ethnic wear men, The House of Rani Premium Edit",
  },
  kids: {
    path: "/premium/kids",
    title: "Kids' Premium Ethnic & Silk Wear",
    description:
      "Shop kids' premium ethnic wear from The Rani Edit — soft silks and festive sets crafted for celebrations, with careful finishes and pan-India delivery.",
    keywords:
      "kids premium ethnic wear, kids silk festive wear, The House of Rani Premium Edit",
  },
  couple: {
    path: "/premium/couple",
    title: "Couple Hand Painted Saree Sets",
    description:
      "Shop couple hand painted saree sets and coordinated premium silk looks — Banarasi, Madhubani, and pure silk pieces made for weddings and occasions.",
    keywords:
      "couple hand painted saree set, couple Banarasi set, matching saree set India, The House of Rani",
  },
};

export function getPremiumAudienceSeo(
  audience: PremiumAudienceSeoId,
): AudienceSeoCopy {
  return AUDIENCE_SEO[audience];
}

export function buildPremiumCollectionMetadata(
  audience: PremiumAudienceSeoId,
): Metadata {
  const copy = getPremiumAudienceSeo(audience);
  return {
    ...buildInfoPageMetadata({
      path: copy.path,
      title: copy.title,
      description: copy.description,
      priority: "support",
    }),
    keywords: copy.keywords,
  };
}

/** Default on-page marketing copy (CMS can override). */
export const PREMIUM_PAGE_COPY = {
  heroTitle: "HAND PAINTED & PURE SILK",
  heroSubtitle:
    "Hand painted sarees, pure silk, Banarasi & Madhubani art — including couple hand painted sets.",
  editorialPreHeading: "The Rani Premium Edit",
  editorialHeading: "HAND PAINTED. PURE SILK. HEIRLOOM.",
  editorialText:
    "Every Premium Edit piece is a hand painted or handloom pure silk saree — Banarasi brocade, Madhubani art, and couple hand painted sets finished over 200+ hours for occasions meant to be inherited.",
  storyHeading: "MORE THAN A SAREE — BANARASI TO MADHUBANI",
  storyText:
    "From Banarasi and pure silk sarees to Madhubani and hand painted artistry, the Premium Collection is an archive of technique — including coordinated couple hand painted sets reimagined for the modern silhouette.",
  finalCtaHeading: "DISCOVER HAND PAINTED & PURE SILK",
  finalCtaText:
    "Explore hand painted sarees, pure silk weaves, Banarasi, Madhubani, and couple sets in The Rani Premium Edit.",
  relatedHeading: "More hand painted & pure silk pieces",
} as const;

export function buildPremiumProductMetadata(
  product: PremiumProductView,
  slug: string,
): Metadata {
  const appUrl = getSiteUrl();
  const safeSlug = encodeURIComponent(slug);
  const pageUrl = `${appUrl}/premium/${safeSlug}`;
  const seoContext = {
    name: product.name,
    category: "Premium",
    subcategory: product.subtitle,
    fabric: product.fabric,
    price: product.price,
  };
  const pageTitle = buildProductPageTitle(
    product.name,
    product.seoTitle,
    seoContext,
  );
  const serpTitle = resolveSerpTitleString(
    pageTitle,
    `Buy ${product.name} Hand Painted Pure Silk Saree Online India`,
  );
  const description = buildProductMetaDescription(
    product.seoDescription,
    product.shortDescription,
    product.description,
    seoContext,
  );
  const keywords = [
    product.name,
    product.fabric,
    product.subtitle,
    ...(product.tags || []),
    ...PREMIUM_SEO_KEYWORDS,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title: pageTitle,
    description,
    keywords,
    alternates: { canonical: `/premium/${safeSlug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: serpTitle,
      description,
      url: pageUrl,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images:
        product.heroImage ?
          [
            {
              url: product.heroImage,
              alt: product.name,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: serpTitle,
      description,
      images: product.heroImage ? [product.heroImage] : undefined,
    },
  };
}

export function buildPremiumProductJsonLd(
  product: PremiumProductView,
  slug: string,
): Record<string, unknown> {
  const appUrl = getSiteUrl();
  const url = `${appUrl}/premium/${encodeURIComponent(slug)}`;
  const images = [
    product.heroImage,
    ...product.images.filter((u) => u && u !== product.heroImage),
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: buildProductMetaDescription(
      product.seoDescription,
      product.shortDescription,
      product.description,
      {
        name: product.name,
        fabric: product.fabric,
        category: "Premium",
        price: product.price,
      },
    ),
    image: images.slice(0, 5),
    sku: product.variants?.[0]?.sku || product.slug,
    url,
    brand: {
      "@type": "Brand",
      name: "The House of Rani",
    },
    category: "Premium",
    ...(product.fabric ?
      {
        material: product.fabric,
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Fabric",
            value: product.fabric,
          },
          {
            "@type": "PropertyValue",
            name: "Collection",
            value: "The Rani Premium Edit",
          },
        ],
      }
    : {
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Collection",
            value: "The Rani Premium Edit",
          },
        ],
      }),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.price,
      availability:
        product.totalStock > 0 ?
          "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 5,
      },
    },
  };
}

function buildPremiumAeoFaqs(appUrl: string): Array<{ q: string; a: string }> {
  return [
    {
      q: "What is The Rani Premium Edit?",
      a: `The Rani Premium Edit (${appUrl}/premium) is The House of Rani’s curated collection of hand painted sarees, pure silk sarees, Banarasi sarees, Madhubani art sarees, and couple hand painted saree sets — heirloom pieces with pan-India delivery.`,
    },
    {
      q: "Do you sell hand painted and Madhubani sarees online in India?",
      a: `Yes. Shop hand painted sarees and Madhubani art sarees at ${appUrl}/premium, with free delivery on orders over ₹1,099 and easy 5-day returns across India.`,
    },
    {
      q: "Where can I buy couple hand painted saree sets?",
      a: `Couple hand painted saree sets and coordinated premium silk looks are available at ${appUrl}/premium/couple in The Rani Premium Edit.`,
    },
    {
      q: "Are Banarasi and pure silk sarees part of Premium Edit?",
      a: `Yes. The Premium Edit at ${appUrl}/premium includes Banarasi sarees and pure silk sarees alongside hand painted and Madhubani pieces for weddings and celebrations.`,
    },
  ];
}

export function buildPremiumCollectionJsonLd(
  audience: PremiumAudienceSeoId,
  products: Array<{ name: string; slug: string; heroImage?: string }>,
): Record<string, unknown> {
  const appUrl = getSiteUrl();
  const copy = getPremiumAudienceSeo(audience);
  const pageUrl = `${appUrl}${copy.path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: copy.title,
        description: copy.description,
        url: pageUrl,
        inLanguage: "en-IN",
        isPartOf: {
          "@type": "WebSite",
          name: "The House of Rani",
          url: appUrl,
        },
        about: [
          "Hand painted saree",
          "Pure silk saree",
          "Banarasi saree",
          "Madhubani art saree",
          "Couple hand painted saree set",
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: appUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Premium Edit",
            item: `${appUrl}/premium`,
          },
          ...(audience !== "all" ?
            [
              {
                "@type": "ListItem",
                position: 3,
                name: copy.title,
                item: pageUrl,
              },
            ]
          : []),
        ],
      },
      {
        "@type": "ItemList",
        name: copy.title,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 24).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${appUrl}/premium/${encodeURIComponent(p.slug)}`,
          name: p.name,
          ...(p.heroImage ? { image: p.heroImage } : {}),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: buildPremiumAeoFaqs(appUrl).map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: {
            "@type": "Answer",
            text: a,
          },
        })),
      },
    ],
  };
}

/** Premium-aware SEO checklist suggestions for admin product form. */
export function buildPremiumSeoSuggestions(input: {
  name: string;
  fabric?: string;
}): { suggestedTitle: string; suggestedDescription: string } {
  const name = input.name.trim();
  const fabric = input.fabric?.trim();
  const fabricBit = fabric ? `${fabric} ` : "";
  if (!name) {
    return { suggestedTitle: "", suggestedDescription: "" };
  }
  return {
    suggestedTitle: `Buy ${fabricBit}${name} Hand Painted Pure Silk Saree Online`
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 65),
    suggestedDescription:
      `Shop ${name} — ${fabricBit || ""}hand painted / pure silk saree with Banarasi or Madhubani craft. Couple sets in The Rani Premium Edit. Free delivery over ₹1,099.`
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160),
  };
}
